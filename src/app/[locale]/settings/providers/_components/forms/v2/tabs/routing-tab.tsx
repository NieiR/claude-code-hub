"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import type { ProviderType } from "@/types/provider";
import { ModelMultiSelect } from "../../../model-multi-select";
import { ModelRedirectEditor } from "../../../model-redirect-editor";
import { useProviderForm } from "../provider-form-context";

export function RoutingTab() {
  const t = useTranslations("settings.providers.form");

  const {
    providerType,
    url,
    key,
    proxyUrl,
    proxyFallbackToDirect,
    isPending,
    allowedModels,
    setAllowedModels,
    modelRedirects,
    setModelRedirects,
    priority,
    setPriority,
    weight,
    setWeight,
    costMultiplier,
    setCostMultiplier,
    groupTag,
    setGroupTag,
    providerId,
  } = useProviderForm();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.routing.modelWhitelist.title")}</CardTitle>
          <CardDescription>{t("sections.routing.modelWhitelist.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelMultiSelect
            providerType={providerType as ProviderType}
            selectedModels={allowedModels || []}
            onChange={setAllowedModels}
            disabled={isPending}
            providerUrl={url}
            apiKey={key}
            proxyUrl={proxyUrl}
            proxyFallbackToDirect={proxyFallbackToDirect}
            providerId={providerId}
          />

          <div className="space-y-2 pt-2">
            <Label>{t("sections.routing.modelRedirects.label")}</Label>
            <ModelRedirectEditor
              value={modelRedirects || {}}
              onChange={setModelRedirects}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.routing.scheduleParams.title")}</CardTitle>
          <CardDescription>{t("sections.routing.scheduleParams.group.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>{t("sections.routing.scheduleParams.group.label")}</Label>
            <TagInput
              placeholder={t("sections.routing.scheduleParams.group.placeholder")}
              value={groupTag || []}
              onChange={(tags) => setGroupTag(tags)}
              maxTags={20}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="priority">
                {t("sections.routing.scheduleParams.priority.label")}
              </Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {t("sections.routing.scheduleParams.priority.desc")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">{t("sections.routing.scheduleParams.weight.label")}</Label>
              <Input
                id="weight"
                type="number"
                min={1}
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value, 10) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                {t("sections.routing.scheduleParams.weight.desc")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costMultiplier">
                {t("sections.routing.scheduleParams.costMultiplier.label")}
              </Label>
              <Input
                id="costMultiplier"
                type="number"
                step="0.01"
                min={0}
                value={costMultiplier}
                onChange={(e) => setCostMultiplier(parseFloat(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                {t("sections.routing.scheduleParams.costMultiplier.desc")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
