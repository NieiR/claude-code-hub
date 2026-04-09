import { describe, expect, test, vi, beforeEach } from "vitest";
import type { Provider, VisionRedirectConfig } from "@/types/provider";

// We test the pure image detection and replacement logic separately from fetch
import {
  detectImageBlocks,
  replaceImageBlocksWithDescriptions,
  buildVisionDescriptionPrompt,
} from "./vision-redirector";

describe("vision-redirector", () => {
  describe("detectImageBlocks", () => {
    test("returns empty array when no image blocks exist", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello" },
            { type: "text", text: "World" },
          ],
        },
      ];
      const result = detectImageBlocks(messages);
      expect(result).toEqual([]);
    });

    test("detects type:image blocks in Claude format", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: "What is this?" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "iVBORw0KGgo=",
              },
            },
          ],
        },
      ];
      const result = detectImageBlocks(messages);
      expect(result).toHaveLength(1);
      expect(result[0].messageIndex).toBe(0);
      expect(result[0].blockIndex).toBe(1);
      expect(result[0].blockType).toBe("image");
    });

    test("detects type:image_url blocks in OpenAI format", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe" },
            {
              type: "image_url",
              image_url: { url: "https://example.com/img.png" },
            },
          ],
        },
      ];
      const result = detectImageBlocks(messages);
      expect(result).toHaveLength(1);
      expect(result[0].messageIndex).toBe(0);
      expect(result[0].blockIndex).toBe(1);
      expect(result[0].blockType).toBe("image_url");
    });

    test("detects multiple image blocks across messages", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: "aaa" } },
          ],
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "I see" }],
        },
        {
          role: "user",
          content: [
            { type: "text", text: "And this?" },
            { type: "image_url", image_url: { url: "https://example.com/2.png" } },
          ],
        },
      ];
      const result = detectImageBlocks(messages);
      expect(result).toHaveLength(2);
      expect(result[0].messageIndex).toBe(0);
      expect(result[1].messageIndex).toBe(2);
    });
  });

  describe("replaceImageBlocksWithDescriptions", () => {
    const format = "[Image Description] ... [/Image Description]";

    test("replaces image block with description text", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: "What is this?" },
            { type: "image", source: { type: "base64", media_type: "image/png", data: "aaa" } },
          ],
        },
      ];
      const detections = detectImageBlocks(messages);
      const descriptions = new Map<string, string>();
      descriptions.set("0-1", "A cat sitting on a windowsill");

      const replaced = replaceImageBlocksWithDescriptions(messages, detections, descriptions, format);
      const content0 = replaced[0].content as Array<Record<string, unknown>>;
      expect(content0[0]).toEqual({ type: "text", text: "What is this?" });
      expect(content0[1]).toEqual({
        type: "text",
        text: "[Image Description] A cat sitting on a windowsill [/Image Description]",
      });
    });

    test("preserves original block when description is missing (degradation)", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: "aaa" } },
          ],
        },
      ];
      const detections = detectImageBlocks(messages);
      const descriptions = new Map<string, string>(); // empty - simulating failure

      const replaced = replaceImageBlocksWithDescriptions(messages, detections, descriptions, format);
      // Original block preserved
      const content0 = replaced[0].content as Array<Record<string, unknown>>;
      expect(content0[0]).toEqual({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: "aaa" },
      });
    });

    test("handles partial failure - one success, one failure", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: "aaa" } },
            { type: "image_url", image_url: { url: "https://example.com/2.png" } },
          ],
        },
      ];
      const detections = detectImageBlocks(messages);
      const descriptions = new Map<string, string>();
      descriptions.set("0-0", "First image description"); // only first succeeded

      const replaced = replaceImageBlocksWithDescriptions(messages, detections, descriptions, format);
      const content0 = replaced[0].content as Array<Record<string, unknown>>;
      expect(content0[0]).toEqual({
        type: "text",
        text: "[Image Description] First image description [/Image Description]",
      });
      // Second block preserved as-is
      expect(content0[1]).toEqual({
        type: "image_url",
        image_url: { url: "https://example.com/2.png" },
      });
    });

    test("does not mutate original messages array", () => {
      const originalMessages = [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: "aaa" } },
          ],
        },
      ];
      const detections = detectImageBlocks(originalMessages);
      const descriptions = new Map<string, string>();
      descriptions.set("0-0", "Description");

      replaceImageBlocksWithDescriptions(originalMessages, detections, descriptions, format);
      // Original unchanged
      const origContent = originalMessages[0].content as Array<Record<string, unknown>>;
      expect(origContent[0]).toEqual({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: "aaa" },
      });
    });
  });

  describe("buildVisionDescriptionPrompt", () => {
    test("builds prompt for base64 image block", () => {
      const block = {
        type: "image",
        source: { type: "base64", media_type: "image/png", data: "iVBORw0KGgo=" },
      };
      const result = buildVisionDescriptionPrompt(block, "claude-sonnet-4-5-20250929");
      expect(result.model).toBe("claude-sonnet-4-5-20250929");
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
      expect(result.messages[0].content).toContainEqual(
        expect.objectContaining({ type: "text", text: "Describe this image in detail" })
      );
    });

    test("overrides model when targetModel is provided", () => {
      const block = {
        type: "image",
        source: { type: "base64", media_type: "image/png", data: "aaa" },
      };
      const result = buildVisionDescriptionPrompt(block, "claude-sonnet-4-5-20250929", "gpt-4o");
      expect(result.model).toBe("gpt-4o");
    });
  });
});
