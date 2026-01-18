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
import { Separator } from "@/components/ui/separator";
import { useProviderForm } from "../provider-form-context";

export function RateLimitTab() {
  const t = useTranslations("settings.providers.form.sections");
  const {
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
  } = useProviderForm();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("rateLimit.title")}</CardTitle>
          <CardDescription>{t("rateLimit.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="limit5hUsd">{t("rateLimit.limit5h.label")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="limit5hUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("rateLimit.limit5h.placeholder")}
                  className="pl-7"
                  value={limit5hUsd ?? ""}
                  onChange={(e) =>
                    setLimit5hUsd(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limitConcurrentSessions">
                {t("rateLimit.limitConcurrent.label")}
              </Label>
              <Input
                id="limitConcurrentSessions"
                type="number"
                min="0"
                step="1"
                placeholder={t("rateLimit.limitConcurrent.placeholder")}
                value={limitConcurrentSessions ?? ""}
                onChange={(e) =>
                  setLimitConcurrentSessions(e.target.value ? parseInt(e.target.value, 10) : null)
                }
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="limitDailyUsd">{t("rateLimit.limitDaily.label")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="limitDailyUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("rateLimit.limitDaily.placeholder")}
                  className="pl-7"
                  value={limitDailyUsd ?? ""}
                  onChange={(e) =>
                    setLimitDailyUsd(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("rateLimit.dailyResetMode.label")}</Label>
              <Select
                value={dailyResetMode}
                onValueChange={(v: "fixed" | "rolling") => setDailyResetMode(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">
                    {t("rateLimit.dailyResetMode.options.fixed")}
                  </SelectItem>
                  <SelectItem value="rolling">
                    {t("rateLimit.dailyResetMode.options.rolling")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dailyResetMode === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="dailyResetTime">{t("rateLimit.dailyResetTime.label")}</Label>
                <Input
                  id="dailyResetTime"
                  type="time"
                  value={dailyResetTime}
                  onChange={(e) => setDailyResetTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="limitWeeklyUsd">{t("rateLimit.limitWeekly.label")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="limitWeeklyUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("rateLimit.limitWeekly.placeholder")}
                  className="pl-7"
                  value={limitWeeklyUsd ?? ""}
                  onChange={(e) =>
                    setLimitWeeklyUsd(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limitMonthlyUsd">{t("rateLimit.limitMonthly.label")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="limitMonthlyUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("rateLimit.limitMonthly.placeholder")}
                  className="pl-7"
                  value={limitMonthlyUsd ?? ""}
                  onChange={(e) =>
                    setLimitMonthlyUsd(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limitTotalUsd">{t("rateLimit.limitTotal.label")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="limitTotalUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("rateLimit.limitTotal.placeholder")}
                  className="pl-7"
                  value={limitTotalUsd ?? ""}
                  onChange={(e) =>
                    setLimitTotalUsd(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
