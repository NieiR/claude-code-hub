import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
  };
});

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/customs/session-list-item", () => ({
  SessionListItem: () => <div>session-list-item</div>,
}));

import { ActiveSessionsList } from "@/components/customs/active-sessions-list";

describe("ActiveSessionsList compact empty state", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("renders one-line empty summary when compactEmpty is enabled", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<ActiveSessionsList compactEmpty={true} />);
    });

    expect(container.textContent).toContain("activeSessions.title");
    expect(container.textContent).toContain("activeSessions.empty");
    expect(container.textContent).not.toContain("activeSessions.viewAll");

    await act(async () => root.unmount());
    container.remove();
  });
});
