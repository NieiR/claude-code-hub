"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EndpointUrlDisplayProps {
  url: string;
  label?: string | null;
  maxLength?: number;
  className?: string;
}

/**
 * Smart URL display component with truncation and tooltip.
 * - If label exists, shows label with full URL in tooltip
 * - Otherwise, shows truncated URL (domain/.../ endpoint) with full URL in tooltip
 */
export function EndpointUrlDisplay({
  url,
  label,
  maxLength = 50,
  className,
}: EndpointUrlDisplayProps) {
  // If there's a label, show it prominently
  if (label) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "font-medium text-sm cursor-default truncate block max-w-full",
              className
            )}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md break-all font-mono text-xs">
          {url}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Parse and truncate URL
  const truncatedUrl = truncateUrl(url, maxLength);
  const needsTruncation = truncatedUrl !== url;

  if (!needsTruncation) {
    return (
      <span className={cn("font-mono text-sm truncate block max-w-full", className)} title={url}>
        {url}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("font-mono text-sm cursor-default truncate block max-w-full", className)}
        >
          {truncatedUrl}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-md break-all font-mono text-xs">
        {url}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Truncate URL in the middle to show domain and endpoint
 * e.g., "https://api.example.com/v1/long/path/endpoint" -> "api.example.com/.../endpoint"
 */
function truncateUrl(url: string, maxLength: number): string {
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    const pathname = parsed.pathname;

    // Calculate how much space we have
    const ellipsis = "/...";
    const baseLength = host.length + ellipsis.length;

    if (baseLength >= maxLength) {
      // Host itself is too long, just truncate it
      return `${host.slice(0, maxLength - 3)}...`;
    }

    const availableForPath = maxLength - baseLength;

    // Get the last segment of the path
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return host;
    }

    const lastSegment = segments[segments.length - 1];

    // If the last segment fits, use it
    if (lastSegment.length <= availableForPath) {
      if (segments.length === 1) {
        return `${host}/${lastSegment}`;
      }
      return `${host}${ellipsis}/${lastSegment}`;
    }

    // Truncate the last segment
    const truncatedSegment = `${lastSegment.slice(0, availableForPath - 3)}...`;
    return `${host}${ellipsis}/${truncatedSegment}`;
  } catch {
    // If URL parsing fails, just truncate from the end
    if (url.length <= maxLength) {
      return url;
    }
    return `${url.slice(0, maxLength - 3)}...`;
  }
}
