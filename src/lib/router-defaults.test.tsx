import { QueryClient, QueryClientProvider, queryOptions, useQuery } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ROUTER_DEFAULTS } from "./router-defaults.ts";

let serverProgress = "QR 01";
const progressOptions = queryOptions({
  queryKey: ["progress"],
  queryFn: async () => {
    const value = serverProgress;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return value;
  },
});

/** 진행 화면(/play/$caseId)과 문제 화면(/t/$qrToken)을 흉내 낸 작은 앱 — 경로도 실제와 같다. 로더가 실제 라우트처럼 queryClient.query를 쓴다. */
function setup() {
  // 앱과 같은 기본값 — 30초 안에는 캐시를 그대로 쓴다.
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
  const root = createRootRoute({ component: Outlet });
  const play = createRoute({
    getParentRoute: () => root,
    path: "/play/$caseId",
    loader: () => queryClient.query(progressOptions),
    component: function Play() {
      const { data } = useQuery(progressOptions);
      return <h1>{data}</h1>;
    },
  });
  const step = createRoute({
    getParentRoute: () => root,
    path: "/t/$qrToken",
    component: () => <p>문제 화면</p>,
  });
  const router = createRouter({
    ...ROUTER_DEFAULTS,
    routeTree: root.addChildren([play, step]),
    history: createMemoryHistory({ initialEntries: ["/play/case-1"] }),
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { queryClient, router };
}

/** 화면에 한 번이라도 나온 제목을 모두 모은다 — 잠깐 스쳐 간 옛 화면도 잡는다. */
function recordHeadings() {
  const seen: string[] = [];
  const observer = new MutationObserver(() => {
    const text = document.querySelector("h1")?.textContent;
    if (text && seen.at(-1) !== text) seen.push(text);
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  return { seen, stop: () => observer.disconnect() };
}

afterEach(() => {
  serverProgress = "QR 01";
});

describe("ROUTER_DEFAULTS", () => {
  // 재현: 정답 → [다음 단서 찾기] → 진행 화면에 "QR 01 차례"가 잠깐 보였다가 "QR 02 차례"로 바뀌었다.
  // 라우터가 예전에 들렀던 화면을 먼저 보여주고 로더를 뒤에서 다시 돌렸기 때문이다.
  it("무효화된(오래된) 진행이면 새로 받을 때까지 기다렸다가 화면을 보여준다", async () => {
    const { queryClient, router } = setup();
    expect(await screen.findByRole("heading", { name: "QR 01" })).toBeTruthy();

    await router.navigate({ to: "/t/$qrToken", params: { qrToken: "QR01" } });
    serverProgress = "QR 02";
    await queryClient.invalidateQueries({ queryKey: ["progress"] });

    const headings = recordHeadings();
    await router.navigate({ to: "/play/$caseId", params: { caseId: "case-1" } });
    await screen.findByRole("heading", { name: "QR 02" });
    headings.stop();

    expect(headings.seen).toEqual(["QR 02"]);
  });

  it("캐시가 아직 신선하면 기다리지 않고 바로 보여준다", async () => {
    const { router } = setup();
    await screen.findByRole("heading", { name: "QR 01" });

    await router.navigate({ to: "/t/$qrToken", params: { qrToken: "QR01" } });
    const startedAt = performance.now();
    await router.navigate({ to: "/play/$caseId", params: { caseId: "case-1" } });

    expect(screen.getByRole("heading", { name: "QR 01" })).toBeTruthy();
    expect(performance.now() - startedAt).toBeLessThan(300);
  });
});
