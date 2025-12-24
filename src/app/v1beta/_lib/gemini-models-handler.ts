/**
 * /v1beta/models 端点处理器 (Gemini 格式)
 *
 * 并行请求所有 Gemini 类型供应商的模型列表，聚合返回 Gemini 兼容格式。
 */

import type { Context } from "hono";
import { PROVIDER_GROUP } from "@/lib/constants/provider.constants";
import { logger } from "@/lib/logger";
import { validateApiKeyAndGetUser } from "@/repository/key";
import { findAllProviders } from "@/repository/provider";
import type { Provider } from "@/types/provider";

// Gemini Models API 响应格式
interface GeminiModel {
  name: string;
  displayName: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods: string[];
}

const UPSTREAM_TIMEOUT_MS = 10000;

/**
 * 从 Authorization 头部或 URL 参数提取 API Key
 */
function extractApiKey(c: Context): string | null {
  // Gemini 支持多种认证方式
  // 1. x-goog-api-key header
  const googApiKey = c.req.header("x-goog-api-key");
  if (googApiKey) return googApiKey;

  // 2. Authorization Bearer
  const authHeader = c.req.header("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }

  // 3. URL query parameter
  const urlKey = c.req.query("key");
  if (urlKey) return urlKey;

  // 4. x-api-key header (fallback)
  const xApiKey = c.req.header("x-api-key");
  if (xApiKey) return xApiKey;

  return null;
}

function parseGroupString(groupString: string): string[] {
  return groupString
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

function checkProviderGroupMatch(providerGroupTag: string | null, userGroups: string): boolean {
  const groups = parseGroupString(userGroups);

  if (groups.includes(PROVIDER_GROUP.ALL)) {
    return true;
  }

  const providerTags = providerGroupTag
    ? parseGroupString(providerGroupTag)
    : [PROVIDER_GROUP.DEFAULT];

  return providerTags.some((tag) => groups.includes(tag));
}

/**
 * 构建上游 Gemini /v1beta/models URL
 */
function buildGeminiModelsUrl(provider: Provider): string {
  const baseUrl = provider.url.replace(/\/$/, "");

  // 如果 baseUrl 已经包含 /v1beta，直接追加 /models
  if (baseUrl.endsWith("/v1beta")) {
    return `${baseUrl}/models`;
  }

  // 否则追加 /v1beta/models
  return `${baseUrl}/v1beta/models`;
}

/**
 * 从单个 Gemini 供应商获取模型列表
 */
async function fetchModelsFromGeminiProvider(
  provider: Provider
): Promise<{ models: GeminiModel[]; error?: string }> {
  const url = buildGeminiModelsUrl(provider);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    // Gemini API 支持两种认证方式：header 或 URL query
    const response = await fetch(`${url}?key=${encodeURIComponent(provider.key)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        models: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // 解析 Gemini 格式的响应
    if (Array.isArray(data.models)) {
      const models = data.models.map(
        (m: {
          name?: string;
          displayName?: string;
          description?: string;
          inputTokenLimit?: number;
          outputTokenLimit?: number;
          supportedGenerationMethods?: string[];
        }) => ({
          name: m.name || "unknown",
          displayName: m.displayName || m.name || "Unknown Model",
          description: m.description,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
          supportedGenerationMethods: m.supportedGenerationMethods || ["generateContent"],
        })
      );
      return { models };
    }

    return { models: [], error: "Unknown response format" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { models: [], error: message };
  }
}

/**
 * 处理 /v1beta/models 请求
 */
export async function handleGeminiModels(c: Context): Promise<Response> {
  try {
    // 1. 认证
    const apiKey = extractApiKey(c);

    if (!apiKey) {
      return c.json(
        {
          error: {
            message: "API key not valid. Please pass a valid API key.",
            status: "UNAUTHENTICATED",
            code: 401,
          },
        },
        401
      );
    }

    const authResult = await validateApiKeyAndGetUser(apiKey);
    if (!authResult) {
      return c.json(
        {
          error: {
            message: "API key not valid. Please pass a valid API key.",
            status: "UNAUTHENTICATED",
            code: 401,
          },
        },
        401
      );
    }

    const { user, key } = authResult;

    if (!user.isEnabled) {
      return c.json(
        {
          error: {
            message: "User account is disabled.",
            status: "PERMISSION_DENIED",
            code: 403,
          },
        },
        403
      );
    }

    // 2. 获取所有 Gemini 类型供应商
    const allProviders = await findAllProviders();
    let geminiProviders = allProviders.filter(
      (p) => p.isEnabled && (p.providerType === "gemini" || p.providerType === "gemini-cli")
    );

    // 3. 根据用户/密钥分组过滤
    const effectiveGroup = key?.providerGroup || user.providerGroup || PROVIDER_GROUP.DEFAULT;
    if (effectiveGroup) {
      geminiProviders = geminiProviders.filter((p) =>
        checkProviderGroupMatch(p.groupTag, effectiveGroup)
      );
    }

    if (geminiProviders.length === 0) {
      return c.json({ models: [] });
    }

    // 4. 并行请求所有供应商的模型列表
    const results = await Promise.all(
      geminiProviders.map(async (provider) => {
        const result = await fetchModelsFromGeminiProvider(provider);
        if (result.error) {
          logger.debug("[GeminiModelsHandler] Failed to fetch models from provider", {
            providerId: provider.id,
            providerName: provider.name,
            error: result.error,
          });
        }
        return { provider, ...result };
      })
    );

    // 5. 聚合所有模型（去重，按 name）
    const modelMap = new Map<string, GeminiModel>();
    let successCount = 0;

    for (const { models, error } of results) {
      if (!error && models.length > 0) {
        successCount++;
        for (const model of models) {
          if (!modelMap.has(model.name)) {
            modelMap.set(model.name, model);
          }
        }
      }
    }

    // 6. 构建响应
    const allModels = Array.from(modelMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    logger.info("[GeminiModelsHandler] Models list served", {
      userId: user.id,
      userName: user.name,
      effectiveGroup,
      totalProviders: geminiProviders.length,
      successfulProviders: successCount,
      totalModels: allModels.length,
    });

    return c.json({
      models: allModels,
    });
  } catch (error) {
    logger.error("[GeminiModelsHandler] Error fetching models", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.json(
      {
        error: {
          message: "Internal error",
          status: "INTERNAL",
          code: 500,
        },
      },
      500
    );
  }
}

/**
 * 处理 /v1beta/models/:model 请求
 */
export async function handleGeminiModelDetail(c: Context): Promise<Response> {
  try {
    const modelName = c.req.param("model");

    // 1. 认证
    const apiKey = extractApiKey(c);

    if (!apiKey) {
      return c.json(
        {
          error: {
            message: "API key not valid. Please pass a valid API key.",
            status: "UNAUTHENTICATED",
            code: 401,
          },
        },
        401
      );
    }

    const authResult = await validateApiKeyAndGetUser(apiKey);
    if (!authResult) {
      return c.json(
        {
          error: {
            message: "API key not valid. Please pass a valid API key.",
            status: "UNAUTHENTICATED",
            code: 401,
          },
        },
        401
      );
    }

    const { user } = authResult;

    if (!user.isEnabled) {
      return c.json(
        {
          error: {
            message: "User account is disabled.",
            status: "PERMISSION_DENIED",
            code: 403,
          },
        },
        403
      );
    }

    // 简化实现：返回基本模型信息
    const model: GeminiModel = {
      name: modelName.startsWith("models/") ? modelName : `models/${modelName}`,
      displayName: formatGeminiDisplayName(modelName),
      supportedGenerationMethods: ["generateContent", "streamGenerateContent", "countTokens"],
    };

    return c.json(model);
  } catch (error) {
    logger.error("[GeminiModelsHandler] Error fetching model detail", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.json(
      {
        error: {
          message: "Internal error",
          status: "INTERNAL",
          code: 500,
        },
      },
      500
    );
  }
}

/**
 * 格式化 Gemini 模型显示名称
 */
function formatGeminiDisplayName(modelName: string): string {
  // models/gemini-2.5-pro -> Gemini 2.5 Pro
  return modelName
    .replace(/^models\//, "")
    .split("-")
    .map((part) => {
      if (part.toLowerCase() === "gemini") return "Gemini";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}
