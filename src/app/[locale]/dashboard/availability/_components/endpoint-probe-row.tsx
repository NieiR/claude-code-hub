"use client";

import { CheckCircle2, Play, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { probeProviderEndpoint } from "@/actions/provider-endpoints";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/utils/error-messages";
import type { ProviderEndpointWithVendor } from "@/repository";
import type { ProviderEndpointProbeLog } from "@/types/provider";
import { EndpointUrlDisplay } from "./endpoint-url-display";
import { getProbeCellColor, ProbeCellTooltip } from "./probe-cell-tooltip";

interface EndpointProbeRowProps {
  endpoint: ProviderEndpointWithVendor;
  probeLogs: ProviderEndpointProbeLog[];
  onProbeComplete?: () => void;
}

/**
 * Single endpoint row with URL, status, heatmap, and probe button
 */
export function EndpointProbeRow({ endpoint, probeLogs, onProbeComplete }: EndpointProbeRowProps) {
  const t = useTranslations("dashboard.availability.probeHistory");
  const tErrors = useTranslations("errors");
  const [probing, setProbing] = useState(false);

  const handleProbe = async () => {
    setProbing(true);
    try {
      const result = await probeProviderEndpoint({
        endpointId: endpoint.id,
        timeoutMs: 10000,
      });

      if (result.ok) {
        toast.success(t("probeSuccess"));
        onProbeComplete?.();
      } else {
        toast.error(
          result.errorCode ? getErrorMessage(tErrors, result.errorCode) : t("probeFailed")
        );
      }
    } catch {
      toast.error(t("probeFailed"));
    } finally {
      setProbing(false);
    }
  };

  // Get the last probe status
  const probeStatus = endpoint.lastProbeOk;

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* URL Display - flex-1 with min-width to allow truncation */}
      <div className="flex-1 min-w-0 max-w-[300px]">
        <EndpointUrlDisplay url={endpoint.url} label={endpoint.label} maxLength={40} />
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        {probeStatus === null ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
          >
            N/A
          </Badge>
        ) : probeStatus ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
            <CheckCircle2 className="w-3 h-3 mr-0.5" />
            OK
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          >
            <XCircle className="w-3 h-3 mr-0.5" />
            ERR
          </Badge>
        )}
      </div>

      {/* Heatmap Cells - fixed width container */}
      <div className="shrink-0 flex gap-px">
        {/* Show last 30 probes, from oldest to newest (left to right) */}
        {Array.from({ length: 30 }).map((_, index) => {
          // probeLogs is sorted newest first, so we need to reverse the index
          const probeIndex = 29 - index;
          const probe = probeLogs[probeIndex] ?? null;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-3 h-5 rounded-[2px] cursor-pointer transition-opacity hover:opacity-80",
                    getProbeCellColor(probe)
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <ProbeCellTooltip probe={probe} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Probe Button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7"
        onClick={handleProbe}
        disabled={probing}
      >
        <Play className={cn("h-3.5 w-3.5", probing && "animate-pulse")} />
      </Button>
    </div>
  );
}
