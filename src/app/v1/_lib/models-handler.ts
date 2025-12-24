/**
 * /v1/models 端点处理器
 *
 * 并行请求所有上游供应商的模型列表，聚合返回 OpenAI 兼容格式。
 */

import type { Context } from "hono";
import { logger } from "@/lib/logger";
import { validateApiKeyAndGetUser } from "@/repository/key";
import { findAllProviders } from "@/repository/provider";
import { PROVIDER_GROUP } from "@/lib/constants/provider.constants";
import type { Provider } from "@/types/provider";

// OpenAI Models API 响应格式
interface OpenAIModel {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  object: "list";
  data: OpenAIModel[];
}

// 上游请求超时（毫秒）
const UPSTREAM_TIMEOUT_MS = 10000;

/**
 * 从 Authorization 头部提取 API Key
 */
function extractApiKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * 解析逗号分隔的分组字符串为数组
 */
function parseGroupString(groupString: string): string[] {
  return groupString
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

/**
 * 检查供应商分组是否匹配用户分组
 */
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
 * 根据供应商类型推断 owned_by 字段
 */
function getOwnedBy(providerType: string): string {
  switch (providerType) {
    case "claude":
    case "claude-auth":
      return "anthropic";
    case "openai-compatible":
    case "codex":
      return "openai";
    case "gemini":
    case "gemini-cli":
      return "google";
    default:
      return "system";
  }
}

/**
 * 构建上游 /v1/models URL
 */
function buildModelsUrl(provider: Provider): string {
  const baseUrl = provider.url.replace(/\/$/, "");

  // 如果 baseUrl 已经包含 /v1，直接追加 /models
  if (baseUrl.endsWith("/v1")) {
    return `${baseUrl}/models`;
  }

  // 否则追加 /v1/models
  return `${baseUrl}/v1/models`;
}

/**
 * 从单个供应商获取模型列表
 */
async function fetchModelsFromProvider(
  provider: Provider
): Promise<{ models: OpenAIModel[]; error?: string }> {
  const url = buildModelsUrl(provider);
  const ownedBy = getOwnedBy(provider.providerType);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${provider.key}`,
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

    // 解析 OpenAI 格式的响应
    if (data.object === "list" && Array.isArray(data.data)) {
      const models = data.data.map((m: { id: string; created?: number }) => ({
        id: m.id,
        object: "model" as const,
        created: m.created || Math.floor(Date.now() / 1000),
        owned_by: ownedBy,
      }));
      return { models };
    }

    // 尝试解析其他格式（如 Anthropic 的模型列表）
    if (Array.isArray(data)) {
      const models = data.map((m: { id?: string; name?: string }) => ({
        id: m.id || m.name || "unknown",
        object: "model" as const,
        created: Math.floor(Date.now() / 1000),
        owned_by: ownedBy,
      }));
      return { models };
    }

    return { models: [], error: "Unknown response format" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { models: [], error: message };
  }
}

/**
 * 处理 /v1/models 请求
 *
 * 并行请求所有供应商的模型列表并聚合
 */
export async function handleModels(c: Context): Promise<Response> {
  try {
    // 1. 认证
    const authHeader = c.req.header("authorization");
    const apiKeyHeader = c.req.header("x-api-key");
    const apiKey = extractApiKey(authHeader) || apiKeyHeader;

    if (!apiKey) {
      return c.json(
        {
          error: {
            message: "Missing API key",
            type: "authentication_error",
            code: "missing_api_key",
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
            message: "Invalid API key",
            type: "authentication_error",
            code: "invalid_api_key",
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
            message: "User is disabled",
            type: "authentication_error",
            code: "user_disabled",
          },
        },
        401
      );
    }

    // 2. 获取所有供应商
    const allProviders = await findAllProviders();
    let enabledProviders = allProviders.filter((p) => p.isEnabled);

    // 3. 根据用户/密钥分组过滤
    const effectiveGroup = key?.providerGroup || user.providerGroup || PROVIDER_GROUP.DEFAULT;
    if (effectiveGroup) {
      enabledProviders = enabledProviders.filter((p) =>
        checkProviderGroupMatch(p.groupTag, effectiveGroup)
      );
    }

    if (enabledProviders.length === 0) {
      return c.json({ object: "list", data: [] });
    }

    // 4. 并行请求所有供应商的模型列表
    const results = await Promise.all(
      enabledProviders.map(async (provider) => {
        const result = await fetchModelsFromProvider(provider);
        if (result.error) {
          logger.debug("[ModelsHandler] Failed to fetch models from provider", {
            providerId: provider.id,
            providerName: provider.name,
            error: result.error,
          });
        }
        return { provider, ...result };
      })
    );

    // 5. 聚合所有模型（去重）
    const modelMap = new Map<string, OpenAIModel>();
    let successCount = 0;

    for (const { provider, models, error } of results) {
      if (!error && models.length > 0) {
        successCount++;
        for (const model of models) {
          if (!modelMap.has(model.id)) {
            modelMap.set(model.id, model);
          }
        }
      }
    }

    // 6. 构建响应
    const allModels = Array.from(modelMap.values()).sort((a, b) => a.id.localeCompare(b.id));

    logger.info("[ModelsHandler] Models list served", {
      userId: user.id,
      userName: user.name,
      effectiveGroup,
      totalProviders: enabledProviders.length,
      successfulProviders: successCount,
      totalModels: allModels.length,
    });

    return c.json({
      object: "list",
      data: allModels,
    });
  } catch (error) {
    logger.error("[ModelsHandler] Error fetching models", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.json(
      {
        error: {
          message: "Internal server error",
          type: "api_error",
          code: "internal_error",
        },
      },
      500
    );
  }
}

/**
 * 处理 /v1/models/:model 请求
 *
 * 返回单个模型的详情（从本地配置查找）
 */
export async function handleModelDetail(c: Context): Promise<Response> {
  try {
    const modelId = c.req.param("model");

    // 1. 认证
    const authHeader = c.req.header("authorization");
    const apiKeyHeader = c.req.header("x-api-key");
    const apiKey = extractApiKey(authHeader) || apiKeyHeader;

    if (!apiKey) {
      return c.json(
        {
          error: {
            message: "Missing API key",
            type: "authentication_error",
            code: "missing_api_key",
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
            message: "Invalid API key",
            type: "authentication_error",
            code: "invalid_api_key",
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
            message: "User is disabled",
            type: "authentication_error",
            code: "user_disabled",
          },
        },
        401
      );
    }

    // 2. 获取所有供应商并过滤
    const allProviders = await findAllProviders();
    let enabledProviders = allProviders.filter((p) => p.isEnabled);

    const effectiveGroup = key?.providerGroup || user.providerGroup || PROVIDER_GROUP.DEFAULT;
    if (effectiveGroup) {
      enabledProviders = enabledProviders.filter((p) =>
        checkProviderGroupMatch(p.groupTag, effectiveGroup)
      );
    }

    // 3. 查找模型（从任意供应商）
    // 简化实现：返回固定格式，owned_by 根据模型名推断
    let ownedBy = "system";
    if (modelId.startsWith("claude")) {
      ownedBy = "anthropic";
    } else if (modelId.startsWith("gpt") || modelId.startsWith("o1") || modelId.startsWith("o3")) {
      ownedBy = "openai";
    } else if (modelId.startsWith("gemini")) {
      ownedBy = "google";
    }

    const model: OpenAIModel = {
      id: modelId,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: ownedBy,
    };

    return c.json(model);
  } catch (error) {
    logger.error("[ModelsHandler] Error fetching model detail", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.json(
      {
        error: {
          message: "Internal server error",
          type: "api_error",
          code: "internal_error",
        },
      },
      500
    );
  }
}
