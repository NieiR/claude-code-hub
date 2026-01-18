"use client";

import { useTranslations } from "next-intl";
import type { ProviderEndpointProbeLog, ProviderEndpointProbeSource } from "@/types/provider";

interface ProbeCellTooltipProps {
  probe: ProviderEndpointProbeLog | null;
}

/**
 * Tooltip content for a probe result cell in the heatmap
 */
export function ProbeCellTooltip({ probe }: ProbeCellTooltipProps) {
  const t = useTranslations("dashboard.availability.probeHistory");

  if (!probe) {
    return <div className="text-sm text-muted-foreground">{t("tooltip.noData")}</div>;
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatSource = (source: ProviderEndpointProbeSource) => {
    switch (source) {
      case "manual":
        return t("manual");
      case "scheduled":
        return t("auto");
      case "runtime":
        return t("tooltip.runtime");
      default:
        return source;
    }
  };

  return (
    <div className="text-sm space-y-1.5">
      <div className="font-medium">{formatTime(probe.createdAt)}</div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("tooltip.source")}:</span>
        <span className="uppercase text-[10px] tracking-wider font-medium">
          {formatSource(probe.source)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("columns.status")}:</span>
        <span className={probe.ok ? "text-green-500" : "text-red-500"}>
          {probe.statusCode ?? (probe.ok ? "OK" : "Error")}
        </span>
      </div>
      {probe.latencyMs && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("columns.latency")}:</span>
          <span className="font-mono">{probe.latencyMs}ms</span>
        </div>
      )}
      {probe.errorMessage && (
        <div className="text-xs text-red-500 mt-1 max-w-[200px] break-words">
          {probe.errorMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Get cell color based on probe status
 */
export function getProbeCellColor(probe: ProviderEndpointProbeLog | null): string {
  if (!probe) {
    return "bg-slate-300 dark:bg-slate-600"; // Gray = no data
  }
  if (probe.ok) {
    return "bg-green-500"; // Green = success
  }
  return "bg-red-500"; // Red = failure
}
