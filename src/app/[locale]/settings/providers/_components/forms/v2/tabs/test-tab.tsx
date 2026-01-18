"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProviderType } from "@/types/provider";
import { ApiTestButton } from "../../api-test-button";
import { ProxyTestButton } from "../../proxy-test-button";
import { useProviderForm } from "../provider-form-context";

export function TestTab() {
  const t = useTranslations("settings.providers.form");
  const {
    url,
    key,
    proxyUrl,
    proxyFallbackToDirect,
    providerType,
    allowedModels,
    enableMultiProviderTypes,
    providerId,
  } = useProviderForm();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.apiTest.title")}</CardTitle>
          <CardDescription>{t("sections.apiTest.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ApiTestButton
            providerUrl={url}
            apiKey={key}
            proxyUrl={proxyUrl}
            proxyFallbackToDirect={proxyFallbackToDirect}
            providerId={providerId}
            providerType={providerType as ProviderType}
            allowedModels={allowedModels || []}
            enableMultiProviderTypes={enableMultiProviderTypes}
            disabled={!url.trim()}
          />

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">{t("sections.proxy.test.label")}</h4>
            <p className="text-xs text-muted-foreground mb-4">{t("sections.proxy.test.desc")}</p>
            <ProxyTestButton
              providerUrl={url}
              proxyUrl={proxyUrl}
              proxyFallbackToDirect={proxyFallbackToDirect}
              disabled={!url.trim()}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
