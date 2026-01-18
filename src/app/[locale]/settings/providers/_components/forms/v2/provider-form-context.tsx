"use client";

import { createContext, useContext } from "react";
import type {
  CodexParallelToolCallsPreference,
  CodexReasoningEffortPreference,
  CodexReasoningSummaryPreference,
  CodexTextVerbosityPreference,
  McpPassthroughType,
  ProviderType,
} from "@/types/provider";

export interface ProviderFormState {
  mode: "create" | "edit";
  isEdit: boolean;
  enableMultiProviderTypes: boolean;
  hideUrl: boolean;
  hideWebsiteUrl: boolean;
  allowedProviderTypes?: ProviderType[];
  isPending: boolean;

  name: string;
  setName: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  key: string;
  setKey: (v: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;

  providerType: ProviderType | string;
  setProviderType: (v: ProviderType | string) => void;
  groupTag: string[];
  setGroupTag: (v: string[]) => void;
  preserveClientIp: boolean;
  setPreserveClientIp: (v: boolean) => void;
  modelRedirects: Record<string, string>;
  setModelRedirects: (v: Record<string, string>) => void;
  allowedModels: string[];
  setAllowedModels: (v: string[]) => void;
  priority: number;
  setPriority: (v: number) => void;
  weight: number;
  setWeight: (v: number) => void;
  costMultiplier: number;
  setCostMultiplier: (v: number) => void;
  cacheTtlPreference: "inherit" | "5m" | "1h";
  setCacheTtlPreference: (v: "inherit" | "5m" | "1h") => void;
  context1mPreference: "inherit" | "force_enable" | "disabled";
  setContext1mPreference: (v: "inherit" | "force_enable" | "disabled") => void;

  codexReasoningEffortPreference: CodexReasoningEffortPreference;
  setCodexReasoningEffortPreference: (v: CodexReasoningEffortPreference) => void;
  codexReasoningSummaryPreference: CodexReasoningSummaryPreference;
  setCodexReasoningSummaryPreference: (v: CodexReasoningSummaryPreference) => void;
  codexTextVerbosityPreference: CodexTextVerbosityPreference;
  setCodexTextVerbosityPreference: (v: CodexTextVerbosityPreference) => void;
  codexParallelToolCallsPreference: CodexParallelToolCallsPreference;
  setCodexParallelToolCallsPreference: (v: CodexParallelToolCallsPreference) => void;

  limit5hUsd: number | null;
  setLimit5hUsd: (v: number | null) => void;
  limitDailyUsd: number | null;
  setLimitDailyUsd: (v: number | null) => void;
  dailyResetMode: "fixed" | "rolling";
  setDailyResetMode: (v: "fixed" | "rolling") => void;
  dailyResetTime: string;
  setDailyResetTime: (v: string) => void;
  limitWeeklyUsd: number | null;
  setLimitWeeklyUsd: (v: number | null) => void;
  limitMonthlyUsd: number | null;
  setLimitMonthlyUsd: (v: number | null) => void;
  limitTotalUsd: number | null;
  setLimitTotalUsd: (v: number | null) => void;
  limitConcurrentSessions: number | null;
  setLimitConcurrentSessions: (v: number | null) => void;

  failureThreshold: number | undefined;
  setFailureThreshold: (v: number | undefined) => void;
  openDurationMinutes: number | undefined;
  setOpenDurationMinutes: (v: number | undefined) => void;
  halfOpenSuccessThreshold: number | undefined;
  setHalfOpenSuccessThreshold: (v: number | undefined) => void;
  maxRetryAttempts: number | null;
  setMaxRetryAttempts: (v: number | null) => void;

  firstByteTimeoutStreamingSeconds: number | undefined;
  setFirstByteTimeoutStreamingSeconds: (v: number | undefined) => void;
  streamingIdleTimeoutSeconds: number | undefined;
  setStreamingIdleTimeoutSeconds: (v: number | undefined) => void;
  requestTimeoutNonStreamingSeconds: number | undefined;
  setRequestTimeoutNonStreamingSeconds: (v: number | undefined) => void;

  proxyUrl: string;
  setProxyUrl: (v: string) => void;
  proxyFallbackToDirect: boolean;
  setProxyFallbackToDirect: (v: boolean) => void;

  mcpPassthroughType: McpPassthroughType;
  setMcpPassthroughType: (v: McpPassthroughType) => void;
  mcpPassthroughUrl: string;
  setMcpPassthroughUrl: (v: string) => void;

  handleSubmit: (e?: React.FormEvent) => void;
  handleDelete: () => void;
  providerId?: number;
}

export const ProviderFormContext = createContext<ProviderFormState | null>(null);

export function useProviderForm() {
  const context = useContext(ProviderFormContext);
  if (!context) {
    throw new Error("useProviderForm must be used within a ProviderFormProvider");
  }
  return context;
}
