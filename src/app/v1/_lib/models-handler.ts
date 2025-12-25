/**
 * /v1/models 端点处理器
 *
 * 支持多种响应格式：
 * - OpenAI 格式（默认）
 * - Anthropic 格式（当请求包含 anthropic-version header 时）
 */

import type { Context } from "hono";
import { PROVIDER_GROUP } from "@/lib/constants/provider.constants";
import { logger } from "@/lib/logger";
import { validateApiKeyAndGetUser } from "@/repository/key";
import { findAllProviders } from "@/repository/provider";
import type { Provider } from "@/types/provider";

// OpenAI Models API 响应格式
interface OpenAIModel {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

// Anthropic Models API 响应格式
interface AnthropicModel {
  type: "model";
  id: string;
  display_name: string;
  created_at: string;
}

interface AnthropicModelsResponse {
  data: AnthropicModel[];
  has_more: boolean;
  first_id: string | null;
  last_id: string | null;
}

type ResponseFormat = "openai" | "anthropic";

/**
 * 检测请求期望的响应格式
 */
function detectResponseFormat(c: Context): ResponseFormat {
  // 如果有 anthropic-version header，返回 Anthropic 格式
  const anthropicVersion = c.req.header("anthropic-version");
  if (anthropicVersion) {
    return "anthropic";
  }
  return "openai";
}

/**
 * 将内部模型数据转换为 Anthropic 格式
 */
function toAnthropicModel(model: OpenAIModel): AnthropicModel {
  return {
    type: "model",
    id: model.id,
    display_name: formatDisplayName(model.id),
    created_at: new Date(model.created * 1000).toISOString(),
  };
}

/**
 * 格式化模型名称为显示名称
 */
function formatDisplayName(modelId: string): string {
  // claude-sonnet-4-20250514 -> Claude Sonnet 4
  // gpt-4o -> GPT 4o
  // gemini-2.5-pro -> Gemini 2.5 Pro
  return modelId
    .replace(/-\d{8}$/, "") // 移除日期后缀
    .split("-")
    .map((part) => {
      if (part.toLowerCase() === "gpt") return "GPT";
      if (part.toLowerCase() === "claude") return "Claude";
      if (part.toLowerCase() === "gemini") return "Gemini";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
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
 * 根据模型 ID 推断 owned_by 字段
 *
 * 使用关键词匹配（非仅前缀），处理上游供应商重命名的情况
 * 例如：gemini-claude-opus-4-5-thinking 应识别为 anthropic
 *
 * 优先级：具体模型名 > 厂商前缀
 */
function inferOwnedByFromModelId(modelId: string): string {
  const id = modelId.toLowerCase();

  // 优先匹配具体模型系列（处理重命名/别名情况）
  if (id.includes("claude") || id.includes("anthropic")) return "anthropic";
  if (id.includes("gpt-") || id.includes("chatgpt")) return "openai";

  // OpenAI 推理模型系列（o1/o3/o4 需要更精确匹配避免误判）
  if (/\bo[134]-/.test(id) || /\bo[134]$/.test(id)) return "openai";

  // 其他厂商
  if (id.includes("gemini")) return "google";
  if (id.includes("mistral") || id.includes("codestral")) return "mistralai";
  if (id.includes("deepseek")) return "deepseek";
  if (id.includes("qwen")) return "alibaba";

  return "system";
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
 *
 * 注意：返回的模型暂不设置 owned_by，由聚合阶段统一推断
 */
async function fetchModelsFromProvider(
  provider: Provider
): Promise<{ models: OpenAIModel[]; error?: string }> {
  const url = buildModelsUrl(provider);

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
        owned_by: "", // 由聚合阶段统一推断
      }));
      return { models };
    }

    // 尝试解析其他格式（如 Anthropic 的模型列表）
    if (Array.isArray(data)) {
      const models = data.map((m: { id?: string; name?: string }) => ({
        id: m.id || m.name || "unknown",
        object: "model" as const,
        created: Math.floor(Date.now() / 1000),
        owned_by: "", // 由聚合阶段统一推断
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
      const format = detectResponseFormat(c);
      if (format === "anthropic") {
        return c.json({ data: [], has_more: false, first_id: null, last_id: null });
      }
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

    // 5. 聚合所有模型（按 model.id 去重，统一推断 owned_by）
    const modelMap = new Map<string, OpenAIModel>();
    let successCount = 0;

    for (const { models, error } of results) {
      if (!error && models.length > 0) {
        successCount++;
        for (const model of models) {
          if (!modelMap.has(model.id)) {
            modelMap.set(model.id, {
              ...model,
              owned_by: inferOwnedByFromModelId(model.id),
            });
          }
        }
      }
    }

    // 6. 构建响应（根据请求格式）
    const allModels = Array.from(modelMap.values()).sort((a, b) => a.id.localeCompare(b.id));
    const format = detectResponseFormat(c);

    logger.info("[ModelsHandler] Models list served", {
      userId: user.id,
      userName: user.name,
      effectiveGroup,
      totalProviders: enabledProviders.length,
      successfulProviders: successCount,
      totalModels: allModels.length,
      responseFormat: format,
    });

    if (format === "anthropic") {
      const anthropicModels = allModels.map(toAnthropicModel);
      const response: AnthropicModelsResponse = {
        data: anthropicModels,
        has_more: false,
        first_id: anthropicModels.length > 0 ? anthropicModels[0].id : null,
        last_id: anthropicModels.length > 0 ? anthropicModels[anthropicModels.length - 1].id : null,
      };
      return c.json(response);
    }

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

    // 3. 返回模型详情（owned_by 由模型名推断）
    const ownedBy = inferOwnedByFromModelId(modelId);

    const format = detectResponseFormat(c);

    if (format === "anthropic") {
      return c.json({
        type: "model",
        id: modelId,
        display_name: formatDisplayName(modelId),
        created_at: new Date().toISOString(),
      });
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
