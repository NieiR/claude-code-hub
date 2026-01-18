"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CodexParallelToolCallsPreference,
  CodexReasoningEffortPreference,
  CodexReasoningSummaryPreference,
  CodexTextVerbosityPreference,
  McpPassthroughType,
} from "@/types/provider";
import { useProviderForm } from "../provider-form-context";

export function AdvancedTab() {
  const t = useTranslations("settings.providers.form.sections");
  const tCommon = useTranslations("common");

  const {
    // Cache
    cacheTtlPreference,
    setCacheTtlPreference,
    context1mPreference,
    setContext1mPreference,

    // Codex
    codexReasoningEffortPreference,
    setCodexReasoningEffortPreference,
    codexReasoningSummaryPreference,
    setCodexReasoningSummaryPreference,
    codexTextVerbosityPreference,
    setCodexTextVerbosityPreference,
    codexParallelToolCallsPreference,
    setCodexParallelToolCallsPreference,

    // MCP
    mcpPassthroughType,
    setMcpPassthroughType,
    mcpPassthroughUrl,
    setMcpPassthroughUrl,
  } = useProviderForm();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("advanced.cache.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("routing.cacheTtl.label")}</Label>
            <Select value={cacheTtlPreference} onValueChange={(v: any) => setCacheTtlPreference(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">{t("routing.cacheTtl.options.inherit")}</SelectItem>
                <SelectItem value="5m">{t("routing.cacheTtl.options.5m")}</SelectItem>
                <SelectItem value="1h">{t("routing.cacheTtl.options.1h")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("routing.context1m.label")}</Label>
            <Select
              value={context1mPreference}
              onValueChange={(v: any) => setContext1mPreference(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">{t("routing.context1m.options.inherit")}</SelectItem>
                <SelectItem value="force_enable">
                  {t("routing.context1m.options.forceEnable")}
                </SelectItem>
                <SelectItem value="disabled">{t("routing.context1m.options.disabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("advanced.codex.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("routing.codexOverrides.reasoningEffort.label")}</Label>
            <Select
              value={codexReasoningEffortPreference}
              onValueChange={(v: CodexReasoningEffortPreference) =>
                setCodexReasoningEffortPreference(v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">
                  {t("routing.codexOverrides.reasoningEffort.options.inherit")}
                </SelectItem>
                <SelectItem value="none">{tCommon("none")}</SelectItem>
                <SelectItem value="minimal">{tCommon("minimal")}</SelectItem>
                <SelectItem value="low">{tCommon("low")}</SelectItem>
                <SelectItem value="medium">{tCommon("medium")}</SelectItem>
                <SelectItem value="high">{tCommon("high")}</SelectItem>
                <SelectItem value="xhigh">{tCommon("xhigh")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("routing.codexOverrides.reasoningSummary.label")}</Label>
            <Select
              value={codexReasoningSummaryPreference}
              onValueChange={(v: CodexReasoningSummaryPreference) =>
                setCodexReasoningSummaryPreference(v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">
                  {t("routing.codexOverrides.reasoningSummary.options.inherit")}
                </SelectItem>
                <SelectItem value="true">{tCommon("enabled")}</SelectItem>
                <SelectItem value="false">{tCommon("disabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("routing.codexOverrides.textVerbosity.label")}</Label>
            <Select
              value={codexTextVerbosityPreference}
              onValueChange={(v: CodexTextVerbosityPreference) =>
                setCodexTextVerbosityPreference(v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">
                  {t("routing.codexOverrides.textVerbosity.options.inherit")}
                </SelectItem>
                <SelectItem value="low">{tCommon("low")}</SelectItem>
                <SelectItem value="medium">{tCommon("medium")}</SelectItem>
                <SelectItem value="high">{tCommon("high")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("routing.codexOverrides.parallelToolCalls.label")}</Label>
            <Select
              value={codexParallelToolCallsPreference}
              onValueChange={(v: CodexParallelToolCallsPreference) =>
                setCodexParallelToolCallsPreference(v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">
                  {t("routing.codexOverrides.parallelToolCalls.options.inherit")}
                </SelectItem>
                <SelectItem value="true">{tCommon("enabled")}</SelectItem>
                <SelectItem value="false">{tCommon("disabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("mcpPassthrough.title")}</CardTitle>
          <CardDescription>{t("mcpPassthrough.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("mcpPassthrough.type.label")}</Label>
            <Select
              value={mcpPassthroughType}
              onValueChange={(v: McpPassthroughType) => setMcpPassthroughType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("mcpPassthrough.type.none")}</SelectItem>
                <SelectItem value="minimax">{t("mcpPassthrough.type.minimax")}</SelectItem>
                <SelectItem value="glm">{t("mcpPassthrough.type.glm")}</SelectItem>
                <SelectItem value="custom">{t("mcpPassthrough.type.custom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mcpPassthroughType !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="mcpUrl">{t("mcpPassthrough.url.label")}</Label>
              <Input
                id="mcpUrl"
                value={mcpPassthroughUrl || ""}
                onChange={(e) => setMcpPassthroughUrl(e.target.value)}
                placeholder={t("mcpPassthrough.urlPlaceholder")}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
