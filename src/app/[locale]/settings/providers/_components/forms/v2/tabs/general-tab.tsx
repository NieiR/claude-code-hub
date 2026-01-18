"use client";

import { Globe, Key, Link, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProviderType } from "@/types/provider";
import { UrlPreview } from "../../url-preview";
import { useProviderForm } from "../provider-form-context";

function renderProviderTypeLabel(args: {
  type: ProviderType;
  t: ReturnType<typeof useTranslations>;
  enableMultiProviderTypes: boolean;
}) {
  const { type, t, enableMultiProviderTypes } = args;

  switch (type) {
    case "claude":
      return t("providerTypes.claude");
    case "claude-auth":
      return t("providerTypes.claudeAuth");
    case "codex":
      return t("providerTypes.codex");
    case "gemini":
      return t("providerTypes.gemini");
    case "gemini-cli":
      return t("providerTypes.geminiCli");
    case "openai-compatible":
      return enableMultiProviderTypes
        ? t("providerTypes.openaiCompatible")
        : `${t("providerTypes.openaiCompatible")}${t("providerTypes.openaiCompatibleDisabled")}`;
    default:
      return type;
  }
}

export function GeneralTab() {
  const t = useTranslations("settings.providers.form");
  const {
    name,
    setName,
    url,
    setUrl,
    key,
    setKey,
    websiteUrl,
    setWebsiteUrl,
    providerType,
    setProviderType,
    isEdit,
    allowedProviderTypes,
    enableMultiProviderTypes,
    hideUrl,
    hideWebsiteUrl,
  } = useProviderForm();

  const providerTypes = (allowedProviderTypes || [
    "claude",
    "gemini",
    "codex",
    "openai-compatible",
  ]) as ProviderType[];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="providerType">{t("sections.routing.providerType.label")}</Label>
            <Select
              value={providerType}
              onValueChange={setProviderType}
              disabled={isEdit || !enableMultiProviderTypes}
            >
              <SelectTrigger id="providerType">
                <SelectValue placeholder={t("sections.routing.providerType.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {providerTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {renderProviderTypeLabel({
                      type,
                      t,
                      enableMultiProviderTypes,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("name.label")}</Label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder={t("name.placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {!hideUrl && (
              <div className="grid gap-2">
                <Label htmlFor="url">{t("url.label")}</Label>
                <div className="relative">
                  <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="url"
                    placeholder={t("url.placeholder")}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          </div>

          {!hideUrl && url.trim() && <UrlPreview baseUrl={url} providerType={providerType} />}

          <div className="grid gap-2">
            <Label htmlFor="key">{t("key.label")}</Label>
            <div className="relative">
              <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="key"
                type="password"
                placeholder={isEdit ? t("key.leaveEmptyDesc") : t("key.placeholder")}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="pl-9"
              />
            </div>
            {isEdit && <p className="text-xs text-muted-foreground">{t("key.leaveEmptyDesc")}</p>}
          </div>

          {!hideWebsiteUrl && (
            <div className="grid gap-2">
              <Label htmlFor="websiteUrl">{t("websiteUrl.label")}</Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="websiteUrl"
                  placeholder={t("websiteUrl.placeholder")}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("websiteUrl.desc")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
