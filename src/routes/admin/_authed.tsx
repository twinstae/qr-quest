import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCurrentSession } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/_authed")({
  component: Outlet,
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (!session) {
      throw redirect({ to: "/admin/login" });
    }
  },
});
