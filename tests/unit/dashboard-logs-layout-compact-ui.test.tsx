import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockSearchParams = new URLSearchParams("model=gpt-4");

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    useQuery: () => ({ data: undefined, isLoading: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/use-fullscreen", () => ({
  useFullscreen: () => ({
    supported: true,
    isFullscreen: false,
    request: vi.fn(async () => {}),
    exit: vi.fn(async () => {}),
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: any) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: any) => <div>{children}</div>,
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: () => <button type="button" />,
}));

vi.mock("@/app/[locale]/dashboard/logs/_components/virtualized-logs-table", () => ({
  VirtualizedLogsTable: () => <div data-testid="virtualized-logs-table" />,
}));

vi.mock("@/app/[locale]/dashboard/logs/_components/usage-logs-filters", () => ({
  UsageLogsFilters: () => <div data-testid="usage-logs-filters" />,
}));

vi.mock("@/app/[locale]/dashboard/logs/_utils/logs-query", () => ({
  buildLogsUrlQuery: () => new URLSearchParams(),
  parseLogsUrlFilters: () => ({ model: "gpt-4" }),
}));

import { UsageLogsViewVirtualized } from "@/app/[locale]/dashboard/logs/_components/usage-logs-view-virtualized";

function findButtonByText(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll("button")).find((button) =>
    (button.textContent || "").includes(text)
  );
}

describe("dashboard logs compact layout", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("usage logs filter area switches to compact trigger instead of expanded description card", async () => {
    const markup = renderToStaticMarkup(
      <UsageLogsViewVirtualized
        isAdmin={true}
        userId={1}
        providers={[]}
        initialKeys={[]}
        searchParams={{ model: "gpt-4" }}
        currencyCode="USD"
        billingModelSource="original"
      />
    );
    const container = document.createElement("div");
    container.innerHTML = markup;

    expect(findButtonByText(container, "title.filterCriteria")).toBeTruthy();
    expect(container.textContent).not.toContain("title.filterCriteriaDescription");
    expect(container.textContent).not.toContain("logs.stats.description");
  });
});
