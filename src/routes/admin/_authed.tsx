import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/queries/session";

export const Route = createFileRoute("/admin/_authed")({
  component: Outlet,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query({
      ...sessionQueryOptions(),
      staleTime: "static",
    });
    if (!session) {
      throw redirect({ to: "/admin/login" });
    }
  },
});
