"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProviderForm } from "../provider-form-context";

export function ResilienceTab() {
  const t = useTranslations("settings.providers.form");
  const {
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
  } = useProviderForm();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.circuitBreaker.title")}</CardTitle>
          <CardDescription>{t("sections.circuitBreaker.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="failureThreshold">
              {t("sections.circuitBreaker.failureThreshold.label")}
            </Label>
            <Input
              id="failureThreshold"
              type="number"
              min="0"
              value={failureThreshold ?? ""}
              onChange={(e) =>
                setFailureThreshold(e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              placeholder={t("sections.circuitBreaker.failureThreshold.placeholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("sections.circuitBreaker.failureThreshold.desc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openDurationMinutes">
              {t("sections.circuitBreaker.openDuration.label")}
            </Label>
            <Input
              id="openDurationMinutes"
              type="number"
              min="1"
              value={openDurationMinutes ?? ""}
              onChange={(e) =>
                setOpenDurationMinutes(e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              placeholder="5"
            />
            <p className="text-xs text-muted-foreground">
              {t("sections.circuitBreaker.openDuration.desc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="halfOpenSuccessThreshold">
              {t("sections.circuitBreaker.successThreshold.label")}
            </Label>
            <Input
              id="halfOpenSuccessThreshold"
              type="number"
              min="1"
              value={halfOpenSuccessThreshold ?? ""}
              onChange={(e) =>
                setHalfOpenSuccessThreshold(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
              placeholder="3"
            />
            <p className="text-xs text-muted-foreground">
              {t("sections.circuitBreaker.successThreshold.desc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRetryAttempts">
              {t("sections.circuitBreaker.maxRetryAttempts.label")}
            </Label>
            <Input
              id="maxRetryAttempts"
              type="number"
              min="0"
              value={maxRetryAttempts ?? ""}
              onChange={(e) =>
                setMaxRetryAttempts(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              {t("sections.circuitBreaker.maxRetryAttempts.desc")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.timeout.title")}</CardTitle>
          <CardDescription>{t("sections.timeout.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="firstByteTimeout">
              {t("sections.timeout.streamingFirstByte.label")}
            </Label>
            <Input
              id="firstByteTimeout"
              type="number"
              min="1"
              value={firstByteTimeoutStreamingSeconds ?? ""}
              onChange={(e) =>
                setFirstByteTimeoutStreamingSeconds(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="streamingIdleTimeout">
              {t("sections.timeout.streamingIdle.label")}
            </Label>
            <Input
              id="streamingIdleTimeout"
              type="number"
              min="1"
              value={streamingIdleTimeoutSeconds ?? ""}
              onChange={(e) =>
                setStreamingIdleTimeoutSeconds(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
              placeholder="30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestTimeoutNonStreaming">
              {t("sections.timeout.nonStreamingTotal.label")}
            </Label>
            <Input
              id="requestTimeoutNonStreaming"
              type="number"
              min="1"
              value={requestTimeoutNonStreamingSeconds ?? ""}
              onChange={(e) =>
                setRequestTimeoutNonStreamingSeconds(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
              placeholder="60"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.proxy.title")}</CardTitle>
          <CardDescription>{t("sections.proxy.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proxyUrl">{t("sections.proxy.url.label")}</Label>
            <Input
              id="proxyUrl"
              placeholder={t("sections.proxy.url.placeholder")}
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("sections.proxy.url.formats")}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">{t("sections.proxy.fallback.label")}</Label>
              <p className="text-sm text-muted-foreground">{t("sections.proxy.fallback.desc")}</p>
            </div>
            <Switch checked={proxyFallbackToDirect} onCheckedChange={setProxyFallbackToDirect} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
