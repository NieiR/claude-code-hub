import { logger } from "@/lib/logger";
import { findProviderById } from "@/repository/provider";
import type { Provider, VisionRedirectConfig } from "@/types/provider";
import type { ProxySession } from "./session";

const DEFAULT_DESCRIPTION_FORMAT = "[Image Description] ... [/Image Description]";
const DEFAULT_TIMEOUT_MS = 30000;
const VISION_PROMPT = "Describe this image in detail";

interface ImageBlockDetection {
  messageIndex: number;
  blockIndex: number;
  blockType: "image" | "image_url";
  block: Record<string, unknown>;
}

/**
 * Detect image blocks in messages (Claude/OpenAI format)
 */
export function detectImageBlocks(
  messages: Record<string, unknown>[]
): ImageBlockDetection[] {
  const detections: ImageBlockDetection[] = [];

  for (let i = 0; i < messages.length; i++) {
    const content = messages[i].content;
    if (!Array.isArray(content)) continue;

    for (let j = 0; j < content.length; j++) {
      const block = content[j] as Record<string, unknown>;
      if (block.type === "image" || block.type === "image_url") {
        detections.push({
          messageIndex: i,
          blockIndex: j,
          blockType: block.type as "image" | "image_url",
          block,
        });
      }
    }
  }

  return detections;
}

/**
 * Replace detected image blocks with description text
 * Blocks without a corresponding description are preserved (degradation)
 */
export function replaceImageBlocksWithDescriptions(
  messages: Record<string, unknown>[],
  detections: ImageBlockDetection[],
  descriptions: Map<string, string>,
  format: string
): Record<string, unknown>[] {
  // Deep clone to avoid mutation
  const result = structuredClone(messages);

  for (const detection of detections) {
    const key = `${detection.messageIndex}-${detection.blockIndex}`;
    const description = descriptions.get(key);

    if (description !== undefined) {
      const text = format.replace("...", description);
      result[detection.messageIndex].content[detection.blockIndex] = {
        type: "text",
        text,
      };
    }
    // If no description, original block is preserved (degradation)
  }

  return result;
}

/**
 * Build a lightweight request payload for vision description
 */
export function buildVisionDescriptionPrompt(
  imageBlock: Record<string, unknown>,
  model: string,
  targetModel?: string
): { model: string; messages: Record<string, unknown>[]; max_tokens: number } {
  return {
    model: targetModel || model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          imageBlock,
          { type: "text", text: VISION_PROMPT },
        ],
      },
    ],
  };
}

/**
 * Vision redirector
 *
 * When a provider has visionRedirect enabled and the request contains image blocks,
 * calls the target multimodal provider to get image descriptions,
 * then replaces image blocks with structured description text.
 * On failure, preserves original image blocks (degradation).
 */
export class VisionRedirector {
  static async apply(session: ProxySession, provider: Provider): Promise<boolean> {
    const config = provider.visionRedirect;
    if (!config?.enabled) return false;

    // Get messages from request
    const msg = session.request.message as Record<string, unknown>;
    const messages = msg.messages;
    if (!Array.isArray(messages)) return false;

    // Detect image blocks
    const detections = detectImageBlocks(messages as Record<string, unknown>[]);
    if (detections.length === 0) return false;

    logger.info("[VisionRedirector] Image blocks detected, starting vision redirect", {
      providerId: provider.id,
      providerName: provider.name,
      imageCount: detections.length,
      targetProviderId: config.targetProviderId,
    });

    // Resolve target provider
    const targetProvider = await findProviderById(config.targetProviderId);
    if (!targetProvider || !targetProvider.isEnabled) {
      logger.warn("[VisionRedirector] Target provider not found or disabled", {
        targetProviderId: config.targetProviderId,
      });
      return false;
    }

    // Validate self-redirect requires targetModel
    if (config.targetProviderId === provider.id && !config.targetModel) {
      logger.warn("[VisionRedirector] Self-redirect requires targetModel", {
        providerId: provider.id,
      });
      return false;
    }

    const format = config.descriptionFormat || DEFAULT_DESCRIPTION_FORMAT;
    const timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
    const originalModel = session.getOriginalModel() || session.request.model || "";
    const descriptions = new Map<string, string>();

    // Process each image block serially
    for (const detection of detections) {
      const key = `${detection.messageIndex}-${detection.blockIndex}`;
      try {
        const payload = buildVisionDescriptionPrompt(
          detection.block,
          originalModel,
          config.targetModel
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const apiUrl = `${targetProvider.url}/v1/messages`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": targetProvider.key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          logger.warn("[VisionRedirector] Target provider returned error", {
            targetProviderId: config.targetProviderId,
            status: response.status,
            imageKey: key,
          });
          continue; // Skip this image, preserve original block
        }

        const data = (await response.json()) as Record<string, unknown>;
        const content = data.content as Array<{ type: string; text?: string }> | undefined;

        if (content && Array.isArray(content)) {
          const textParts = content
            .filter((b) => b.type === "text" && b.text)
            .map((b) => b.text!);
          if (textParts.length > 0) {
            descriptions.set(key, textParts.join("\n"));
          }
        }
      } catch (error) {
        logger.warn("[VisionRedirector] Failed to get description for image block", {
          targetProviderId: config.targetProviderId,
          imageKey: key,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with next image; this one degrades to original block
      }
    }

    if (descriptions.size === 0) {
      logger.info("[VisionRedirector] No descriptions obtained, preserving original image blocks");
      return false;
    }

    // Replace image blocks with descriptions
    const replacedMessages = replaceImageBlocksWithDescriptions(
      messages as Record<string, unknown>[],
      detections,
      descriptions,
      format
    );

    // Update session request
    msg.messages = replacedMessages;
    const updatedBody = JSON.stringify(session.request.message);
    const encoder = new TextEncoder();
    session.request.buffer = encoder.encode(updatedBody).buffer;

    // Log
    session.request.note = `[Vision Redirected: ${descriptions.size} images via provider #${config.targetProviderId}] ${session.request.note || ""}`;

    logger.info("[VisionRedirector] Vision redirect completed", {
      providerId: provider.id,
      providerName: provider.name,
      imagesProcessed: descriptions.size,
      imagesFailed: detections.length - descriptions.size,
      targetProviderId: config.targetProviderId,
    });

    return true;
  }
}
