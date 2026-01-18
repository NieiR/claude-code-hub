"use client";

import { Activity, Banknote, Bot, Settings2, Sliders } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProviderForm } from "./provider-form-context";
import { AdvancedTab } from "./tabs/advanced-tab";
import { GeneralTab } from "./tabs/general-tab";
import { RateLimitTab } from "./tabs/rate-limit-tab";
import { ResilienceTab } from "./tabs/resilience-tab";
import { RoutingTab } from "./tabs/routing-tab";
import { TestTab } from "./tabs/test-tab";

export function ProviderFormLayout() {
  const t = useTranslations("settings.providers.form");
  const { handleSubmit, isEdit, handleDelete, isPending } = useProviderForm();

  return (
    <form
      className="flex flex-col h-full w-full"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 shrink-0">
            <TabsList className="grid w-full grid-cols-6 h-12">
              <TabsTrigger
                id="provider-form-tab-general"
                value="general"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.general")}</span>
              </TabsTrigger>
              <TabsTrigger
                id="provider-form-tab-routing"
                value="routing"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.routing")}</span>
              </TabsTrigger>
              <TabsTrigger
                id="provider-form-tab-limits"
                value="limits"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Banknote className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.limits")}</span>
              </TabsTrigger>
              <TabsTrigger
                id="provider-form-tab-resilience"
                value="resilience"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.resilience")}</span>
              </TabsTrigger>
              <TabsTrigger
                id="provider-form-tab-advanced"
                value="advanced"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Sliders className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.advanced")}</span>
              </TabsTrigger>
              <TabsTrigger
                id="provider-form-tab-test"
                value="test"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">{t("tabs.test")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="general" className="mt-0 h-full space-y-4">
              <GeneralTab />
            </TabsContent>
            <TabsContent value="routing" className="mt-0 h-full space-y-4">
              <RoutingTab />
            </TabsContent>
            <TabsContent value="limits" className="mt-0 h-full space-y-4">
              <RateLimitTab />
            </TabsContent>
            <TabsContent value="resilience" className="mt-0 h-full space-y-4">
              <ResilienceTab />
            </TabsContent>
            <TabsContent value="advanced" className="mt-0 h-full space-y-4">
              <AdvancedTab />
            </TabsContent>
            <TabsContent value="test" className="mt-0 h-full space-y-4">
              <TestTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="border-t bg-muted/10 p-4 px-6 flex justify-between items-center shrink-0">
        <div>
          {isEdit && (
            <Button variant="destructive" onClick={handleDelete} disabled={isPending} type="button">
              {t("buttons.delete")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEdit
                ? t("buttons.updating")
                : t("buttons.submitting")
              : isEdit
                ? t("buttons.update")
                : t("buttons.submit")}
          </Button>
        </div>
      </div>
    </form>
  );
}
