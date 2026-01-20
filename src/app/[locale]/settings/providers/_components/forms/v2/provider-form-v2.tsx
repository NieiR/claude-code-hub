"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { addProvider, editProvider, removeProvider } from "@/actions/providers";
import { isValidUrl } from "@/lib/utils/validation";
import type {
  CodexParallelToolCallsPreference,
  CodexReasoningEffortPreference,
  CodexReasoningSummaryPreference,
  CodexTextVerbosityPreference,
  McpPassthroughType,
  ProviderDisplay,
  ProviderType,
} from "@/types/provider";
import { ProviderFormContext } from "./provider-form-context";
import { ProviderFormLayout } from "./provider-form-layout";

const PROVIDER_TYPES: ProviderType[] = [
  "claude",
  "claude-auth",
  "codex",
  "gemini",
  "gemini-cli",
  "openai-compatible",
];

function isProviderType(value: ProviderType | string): value is ProviderType {
  return PROVIDER_TYPES.includes(value as ProviderType);
}

interface ProviderFormV2Props {
  mode: "create" | "edit";
  onSuccess?: () => void;
  provider?: ProviderDisplay;
  cloneProvider?: ProviderDisplay;
  enableMultiProviderTypes: boolean;
  hideUrl?: boolean;
  hideWebsiteUrl?: boolean;
  preset?: {
    name?: string;
    url?: string;
    websiteUrl?: string;
    providerType?: ProviderType;
  };
  allowedProviderTypes?: ProviderType[];
  urlResolver?: (providerType: ProviderType) => Promise<string | null>;
}

export function ProviderFormV2({
  mode,
  provider,
  cloneProvider,
  preset,
  onSuccess,
  enableMultiProviderTypes,
  hideUrl = false,
  hideWebsiteUrl = false,
  allowedProviderTypes,
  urlResolver,
}: ProviderFormV2Props) {
  const tErrors = useTranslations("settings.providers.form.errors");
  const tDeleteDialog = useTranslations("settings.providers.form.deleteDialog");
  const tSuccess = useTranslations("settings.providers.form.success");
  const tProviders = useTranslations("settings.providers");
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";

  // State Management - Initialize from camelCase properties
  const [name, setName] = useState(
    isEdit ? provider?.name || "" : cloneProvider?.name || preset?.name || ""
  );
  const [url, setUrl] = useState(
    isEdit ? provider?.url || "" : cloneProvider?.url || preset?.url || ""
  );
  const [key, setKey] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(
    isEdit ? provider?.websiteUrl || "" : cloneProvider?.websiteUrl || preset?.websiteUrl || ""
  );
  const [autoUrlPending, setAutoUrlPending] = useState(false);

  const [providerType, setProviderType] = useState<ProviderType | string>(
    isEdit
      ? provider?.providerType || "claude"
      : cloneProvider?.providerType || preset?.providerType || "claude"
  );

  const [groupTag, setGroupTag] = useState<string[]>(
    isEdit
      ? provider?.groupTag
        ? provider.groupTag.split(",")
        : []
      : cloneProvider?.groupTag
        ? cloneProvider.groupTag.split(",")
        : []
  );

  const [preserveClientIp, setPreserveClientIp] = useState(
    isEdit ? provider?.preserveClientIp || false : cloneProvider?.preserveClientIp || false
  );

  const [modelRedirects, setModelRedirects] = useState<Record<string, string>>(
    isEdit ? (provider?.modelRedirects ?? {}) : (cloneProvider?.modelRedirects ?? {})
  );

  const [allowedModels, setAllowedModels] = useState<string[]>(
    isEdit ? (provider?.allowedModels ?? []) : (cloneProvider?.allowedModels ?? [])
  );

  const [priority, setPriority] = useState(
    isEdit ? provider?.priority || 0 : cloneProvider?.priority || 0
  );

  const [weight, setWeight] = useState(isEdit ? provider?.weight || 1 : cloneProvider?.weight || 1);

  const [costMultiplier, setCostMultiplier] = useState(
    isEdit ? provider?.costMultiplier || 1 : cloneProvider?.costMultiplier || 1
  );

  const [cacheTtlPreference, setCacheTtlPreference] = useState<"inherit" | "5m" | "1h">(
    isEdit && provider?.cacheTtlPreference ? provider.cacheTtlPreference : "inherit"
  );

  const [context1mPreference, setContext1mPreference] = useState<
    "inherit" | "force_enable" | "disabled"
  >(isEdit && provider?.context1mPreference ? provider.context1mPreference : "inherit");

  // Codex Preferences
  const [codexReasoningEffortPreference, setCodexReasoningEffortPreference] =
    useState<CodexReasoningEffortPreference>(
      isEdit ? provider?.codexReasoningEffortPreference || "inherit" : "inherit"
    );
  const [codexReasoningSummaryPreference, setCodexReasoningSummaryPreference] =
    useState<CodexReasoningSummaryPreference>(
      isEdit ? provider?.codexReasoningSummaryPreference || "inherit" : "inherit"
    );
  const [codexTextVerbosityPreference, setCodexTextVerbosityPreference] =
    useState<CodexTextVerbosityPreference>(
      isEdit ? provider?.codexTextVerbosityPreference || "inherit" : "inherit"
    );
  const [codexParallelToolCallsPreference, setCodexParallelToolCallsPreference] =
    useState<CodexParallelToolCallsPreference>(
      isEdit ? provider?.codexParallelToolCallsPreference || "inherit" : "inherit"
    );

  // Rate Limits
  const [limit5hUsd, setLimit5hUsd] = useState<number | null>(
    isEdit ? provider?.limit5hUsd || null : null
  );
  const [limitDailyUsd, setLimitDailyUsd] = useState<number | null>(
    isEdit ? provider?.limitDailyUsd || null : null
  );
  const [dailyResetMode, setDailyResetMode] = useState<"fixed" | "rolling">(
    isEdit ? provider?.dailyResetMode || "rolling" : "rolling"
  );
  const [dailyResetTime, setDailyResetTime] = useState(
    isEdit ? provider?.dailyResetTime || "00:00" : "00:00"
  );
  const [limitWeeklyUsd, setLimitWeeklyUsd] = useState<number | null>(
    isEdit ? provider?.limitWeeklyUsd || null : null
  );
  const [limitMonthlyUsd, setLimitMonthlyUsd] = useState<number | null>(
    isEdit ? provider?.limitMonthlyUsd || null : null
  );
  const [limitTotalUsd, setLimitTotalUsd] = useState<number | null>(
    isEdit ? provider?.limitTotalUsd || null : null
  );
  const [limitConcurrentSessions, setLimitConcurrentSessions] = useState<number | null>(
    isEdit ? provider?.limitConcurrentSessions || null : null
  );

  // Circuit Breaker
  const [failureThreshold, setFailureThreshold] = useState<number | undefined>(
    isEdit ? (provider?.circuitBreakerFailureThreshold ?? undefined) : undefined
  );
  const [openDurationMinutes, setOpenDurationMinutes] = useState<number | undefined>(
    isEdit
      ? provider?.circuitBreakerOpenDuration
        ? provider.circuitBreakerOpenDuration / 60000
        : undefined
      : undefined
  );
  const [halfOpenSuccessThreshold, setHalfOpenSuccessThreshold] = useState<number | undefined>(
    isEdit ? (provider?.circuitBreakerHalfOpenSuccessThreshold ?? undefined) : undefined
  );
  const [maxRetryAttempts, setMaxRetryAttempts] = useState<number | null>(
    isEdit ? (provider?.maxRetryAttempts ?? null) : null
  );

  // Timeouts
  const [firstByteTimeoutStreamingSeconds, setFirstByteTimeoutStreamingSeconds] = useState<
    number | undefined
  >(
    isEdit
      ? provider?.firstByteTimeoutStreamingMs
        ? provider.firstByteTimeoutStreamingMs / 1000
        : undefined
      : undefined
  );
  const [streamingIdleTimeoutSeconds, setStreamingIdleTimeoutSeconds] = useState<
    number | undefined
  >(
    isEdit
      ? provider?.streamingIdleTimeoutMs
        ? provider.streamingIdleTimeoutMs / 1000
        : undefined
      : undefined
  );
  const [requestTimeoutNonStreamingSeconds, setRequestTimeoutNonStreamingSeconds] = useState<
    number | undefined
  >(
    isEdit
      ? provider?.requestTimeoutNonStreamingMs
        ? provider.requestTimeoutNonStreamingMs / 1000
        : undefined
      : undefined
  );

  // Proxy
  const [proxyUrl, setProxyUrl] = useState(
    isEdit ? provider?.proxyUrl || "" : cloneProvider?.proxyUrl || ""
  );
  const [proxyFallbackToDirect, setProxyFallbackToDirect] = useState(
    isEdit
      ? provider?.proxyFallbackToDirect || false
      : cloneProvider?.proxyFallbackToDirect || false
  );

  // MCP
  const [mcpPassthroughType, setMcpPassthroughType] = useState<McpPassthroughType>(
    isEdit ? provider?.mcpPassthroughType || "none" : "none"
  );
  const [mcpPassthroughUrl, setMcpPassthroughUrl] = useState(
    isEdit ? provider?.mcpPassthroughUrl || "" : ""
  );

  useEffect(() => {
    if (isEdit) return;
    if (!hideUrl || !urlResolver) return;
    if (!isProviderType(providerType)) return;

    let cancelled = false;
    setAutoUrlPending(true);

    urlResolver(providerType)
      .then((resolved) => {
        if (cancelled) return;
        setUrl(resolved?.trim() ? resolved.trim() : "");
      })
      .catch(() => {
        if (cancelled) return;
        setUrl("");
      })
      .finally(() => {
        if (cancelled) return;
        setAutoUrlPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, hideUrl, urlResolver, providerType]);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error(tErrors("nameRequired"));
      return;
    }
    if (!url.trim()) {
      if (hideUrl) {
        toast.error(tProviders("noEndpoints"), {
          description: tProviders("noEndpointsDesc"),
        });
        return;
      }
      toast.error(tErrors("invalidUrl"));
      return;
    }
    if (!isValidUrl(url.trim())) {
      toast.error(tErrors("invalidUrl"));
      return;
    }
    if (!isEdit && !key.trim()) {
      toast.error(tErrors("keyRequired"));
      return;
    }
    if (groupTag.join(",").length > 50) {
      toast.error(tErrors("groupTagTooLong", { max: 50 }));
      return;
    }

    startTransition(async () => {
      try {
        const payloadBase = {
          name: name.trim(),
          url: url.trim(),
          provider_type: providerType as ProviderType,
          website_url: websiteUrl.trim() || null,
          preserve_client_ip: preserveClientIp,
          model_redirects: modelRedirects,
          allowed_models: allowedModels.length > 0 ? allowedModels : null,
          weight,
          priority,
          cost_multiplier: costMultiplier,
          group_tag: groupTag.length > 0 ? groupTag.join(",") : null,

          limit_5h_usd: limit5hUsd,
          limit_daily_usd: limitDailyUsd,
          daily_reset_mode: dailyResetMode,
          daily_reset_time: dailyResetTime,
          limit_weekly_usd: limitWeeklyUsd,
          limit_monthly_usd: limitMonthlyUsd,
          limit_total_usd: limitTotalUsd,
          limit_concurrent_sessions: limitConcurrentSessions,

          max_retry_attempts: maxRetryAttempts ?? null,
          circuit_breaker_failure_threshold: failureThreshold ?? 5,
          circuit_breaker_open_duration: openDurationMinutes
            ? openDurationMinutes * 60000
            : 1800000,
          circuit_breaker_half_open_success_threshold: halfOpenSuccessThreshold ?? 2,

          first_byte_timeout_streaming_ms: firstByteTimeoutStreamingSeconds
            ? firstByteTimeoutStreamingSeconds * 1000
            : undefined,
          streaming_idle_timeout_ms: streamingIdleTimeoutSeconds
            ? streamingIdleTimeoutSeconds * 1000
            : undefined,
          request_timeout_non_streaming_ms: requestTimeoutNonStreamingSeconds
            ? requestTimeoutNonStreamingSeconds * 1000
            : undefined,

          proxy_url: proxyUrl.trim() || null,
          proxy_fallback_to_direct: proxyFallbackToDirect,

          cache_ttl_preference: cacheTtlPreference,
          context_1m_preference: context1mPreference,

          codex_reasoning_effort_preference: codexReasoningEffortPreference,
          codex_reasoning_summary_preference: codexReasoningSummaryPreference,
          codex_text_verbosity_preference: codexTextVerbosityPreference,
          codex_parallel_tool_calls_preference: codexParallelToolCallsPreference,

          mcp_passthrough_type: mcpPassthroughType,
          mcp_passthrough_url: mcpPassthroughUrl.trim() || null,

          tpm: null,
          rpm: null,
          rpd: null,
          cc: null,
        };

        if (isEdit && provider?.id) {
          const payload: Parameters<typeof editProvider>[1] = {
            ...payloadBase,
            is_enabled: provider?.isEnabled ?? true,
            ...(key.trim() ? { key: key.trim() } : {}),
          };
          const res = await editProvider(provider.id, payload);
          if (res.ok) {
            toast.success(tSuccess("updated"));
            onSuccess?.();
          } else {
            toast.error(res.error || tErrors("updateFailed"));
          }
        } else {
          const payload: Parameters<typeof addProvider>[0] = {
            ...payloadBase,
            key: key.trim(),
            is_enabled: true,
          };
          const res = await addProvider(payload);
          if (res.ok) {
            toast.success(tSuccess("created"));

            // Reset form (create mode only) to avoid carrying over previous values
            setName("");
            setUrl("");
            setKey("");
            setProviderType("claude");
            setWebsiteUrl("");
            setGroupTag([]);
            setPreserveClientIp(false);
            setModelRedirects({});
            setAllowedModels([]);
            setPriority(0);
            setWeight(1);
            setCostMultiplier(1);

            setLimit5hUsd(null);
            setLimitDailyUsd(null);
            setDailyResetMode("rolling");
            setDailyResetTime("00:00");
            setLimitWeeklyUsd(null);
            setLimitMonthlyUsd(null);
            setLimitTotalUsd(null);
            setLimitConcurrentSessions(null);

            setFailureThreshold(undefined);
            setOpenDurationMinutes(undefined);
            setHalfOpenSuccessThreshold(undefined);
            setMaxRetryAttempts(null);

            setFirstByteTimeoutStreamingSeconds(undefined);
            setStreamingIdleTimeoutSeconds(undefined);
            setRequestTimeoutNonStreamingSeconds(undefined);

            setProxyUrl("");
            setProxyFallbackToDirect(false);

            setCacheTtlPreference("inherit");
            setContext1mPreference("inherit");

            setCodexReasoningEffortPreference("inherit");
            setCodexReasoningSummaryPreference("inherit");
            setCodexTextVerbosityPreference("inherit");
            setCodexParallelToolCallsPreference("inherit");

            setMcpPassthroughType("none");
            setMcpPassthroughUrl("");

            onSuccess?.();
          } else {
            toast.error(res.error || tErrors("addFailed"));
          }
        }
      } catch (error) {
        console.error(error);
        toast.error(tErrors("unexpected"));
      }
    });
  };

  const handleDelete = async () => {
    if (!isEdit || !provider?.id) return;
    if (!confirm(tDeleteDialog("confirmShort"))) return;

    startTransition(async () => {
      const res = await removeProvider(provider.id);
      if (res.ok) {
        toast.success(tSuccess("deleted"));
        onSuccess?.();
      } else {
        toast.error(res.error || tErrors("deleteFailed"));
      }
    });
  };

  return (
    <ProviderFormContext.Provider
      value={{
        mode,
        isEdit,
        enableMultiProviderTypes,
        hideUrl,
        hideWebsiteUrl,
        allowedProviderTypes,
        isPending: isPending || autoUrlPending,
        name,
        setName,
        url,
        setUrl,
        key,
        setKey,
        websiteUrl,
        setWebsiteUrl,
        providerType,
        setProviderType,
        groupTag,
        setGroupTag,
        preserveClientIp,
        setPreserveClientIp,
        modelRedirects,
        setModelRedirects,
        allowedModels,
        setAllowedModels,
        priority,
        setPriority,
        weight,
        setWeight,
        costMultiplier,
        setCostMultiplier,
        cacheTtlPreference,
        setCacheTtlPreference,
        context1mPreference,
        setContext1mPreference,
        codexReasoningEffortPreference,
        setCodexReasoningEffortPreference,
        codexReasoningSummaryPreference,
        setCodexReasoningSummaryPreference,
        codexTextVerbosityPreference,
        setCodexTextVerbosityPreference,
        codexParallelToolCallsPreference,
        setCodexParallelToolCallsPreference,
        limit5hUsd,
        setLimit5hUsd,
        limitDailyUsd,
        setLimitDailyUsd,
        dailyResetMode,
        setDailyResetMode,
        dailyResetTime,
        setDailyResetTime,
        limitWeeklyUsd,
        setLimitWeeklyUsd,
        limitMonthlyUsd,
        setLimitMonthlyUsd,
        limitTotalUsd,
        setLimitTotalUsd,
        limitConcurrentSessions,
        setLimitConcurrentSessions,
        failureThreshold,
        setFailureThreshold,
        openDurationMinutes,
        setOpenDurationMinutes,
        halfOpenSuccessThreshold,
        setHalfOpenSuccessThreshold,
        maxRetryAttempts,
        setMaxRetryAttempts,
        firstByteTimeoutStreamingSeconds,
        setFirstByteTimeoutStreamingSeconds,
        streamingIdleTimeoutSeconds,
        setStreamingIdleTimeoutSeconds,
        requestTimeoutNonStreamingSeconds,
        setRequestTimeoutNonStreamingSeconds,
        proxyUrl,
        setProxyUrl,
        proxyFallbackToDirect,
        setProxyFallbackToDirect,
        mcpPassthroughType,
        setMcpPassthroughType,
        mcpPassthroughUrl,
        setMcpPassthroughUrl,
        handleSubmit,
        handleDelete,
        providerId: provider?.id,
      }}
    >
      <ProviderFormLayout />
    </ProviderFormContext.Provider>
  );
}
