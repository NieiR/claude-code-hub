"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProviderEndpointWithVendor } from "@/repository";
import type { ProviderEndpointProbeLog, ProviderType } from "@/types/provider";
import { EndpointProbeRow } from "./endpoint-probe-row";

// Provider type grouping order and display names
const PROVIDER_TYPE_GROUPS: { type: ProviderType; labelKey: string }[] = [
  { type: "claude", labelKey: "groupByType.claude" },
  { type: "claude-auth", labelKey: "groupByType.claudeAuth" },
  { type: "gemini", labelKey: "groupByType.gemini" },
  { type: "gemini-cli", labelKey: "groupByType.geminiCli" },
  { type: "codex", labelKey: "groupByType.codex" },
  { type: "openai-compatible", labelKey: "groupByType.openaiCompatible" },
];

interface EndpointWithProbeLogs extends ProviderEndpointWithVendor {
  probeLogs: ProviderEndpointProbeLog[];
}

export function EndpointProbeHistory() {
  const t = useTranslations("dashboard.availability");

  const [endpoints, setEndpoints] = useState<ProviderEndpointWithVendor[]>([]);
  const [probeLogs, setProbeLogs] = useState<Record<number, ProviderEndpointProbeLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch("/api/availability/endpoints");
      const data = await res.json();
      if (data.endpoints) {
        setEndpoints(data.endpoints);
        return data.endpoints as ProviderEndpointWithVendor[];
      }
    } catch (error) {
      console.error("Failed to fetch endpoints", error);
    }
    return [];
  }, []);

  const fetchProbeLogs = useCallback(async (endpointIds: number[]) => {
    if (endpointIds.length === 0) return;

    try {
      const res = await fetch(
        `/api/availability/endpoints/probe-logs/batch?endpointIds=${endpointIds.join(",")}&limit=30`
      );
      const data = await res.json();
      if (data.logs) {
        // Convert string keys back to numbers
        const logsMap: Record<number, ProviderEndpointProbeLog[]> = {};
        for (const [key, value] of Object.entries(data.logs)) {
          logsMap[Number.parseInt(key, 10)] = value as ProviderEndpointProbeLog[];
        }
        setProbeLogs(logsMap);
      }
    } catch (error) {
      console.error("Failed to fetch probe logs", error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    const eps = await fetchEndpoints();
    if (eps.length > 0) {
      await fetchProbeLogs(eps.map((e) => e.id));
    }
    setRefreshing(false);
    setLoading(false);
  }, [fetchEndpoints, fetchProbeLogs]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Group endpoints by provider type
  const groupedEndpoints = useMemo(() => {
    const groups: Map<ProviderType, EndpointWithProbeLogs[]> = new Map();

    for (const typeGroup of PROVIDER_TYPE_GROUPS) {
      groups.set(typeGroup.type, []);
    }

    for (const endpoint of endpoints) {
      const group = groups.get(endpoint.providerType);
      if (group) {
        group.push({
          ...endpoint,
          probeLogs: probeLogs[endpoint.id] || [],
        });
      }
    }

    // Sort endpoints within each group by vendor domain, then by URL
    for (const group of groups.values()) {
      group.sort((a, b) => {
        const domainCompare = a.vendor.websiteDomain.localeCompare(b.vendor.websiteDomain);
        if (domainCompare !== 0) return domainCompare;
        return a.url.localeCompare(b.url);
      });
    }

    return groups;
  }, [endpoints, probeLogs]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t("probeHistory.title")}
          </CardTitle>
          <CardDescription>{t("probeHistory.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skeleton for loading state */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasEndpoints = endpoints.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("probeHistory.title")}
            </CardTitle>
            <CardDescription className="mt-1.5">{t("probeHistory.description")}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {refreshing ? t("actions.refreshing") : t("actions.refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasEndpoints ? (
          <div className="text-center text-muted-foreground py-8">{t("states.noData")}</div>
        ) : (
          <div className="space-y-6">
            {PROVIDER_TYPE_GROUPS.map(({ type, labelKey }) => {
              const group = groupedEndpoints.get(type) || [];
              if (group.length === 0) return null;

              return (
                <div key={type}>
                  {/* Group Header */}
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono uppercase tracking-wider">
                      {type}
                    </span>
                    <span>{t(`probeHistory.${labelKey}`)}</span>
                    <span className="text-xs font-normal">({group.length})</span>
                  </h3>

                  {/* Endpoint Rows */}
                  <div className="rounded-md border divide-y">
                    {group.map((endpoint) => (
                      <div key={endpoint.id} className="px-3">
                        <EndpointProbeRow
                          endpoint={endpoint}
                          probeLogs={endpoint.probeLogs}
                          onProbeComplete={fetchAllData}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span>{t("probeHistory.legend.success")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span>{t("probeHistory.legend.failure")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
                <span>{t("probeHistory.legend.noData")}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
