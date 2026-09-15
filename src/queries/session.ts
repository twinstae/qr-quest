import { queryOptions } from "@tanstack/react-query";

import { getCurrentSession } from "@/lib/auth-client";

export const sessionQueryKey = ["session"] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionQueryKey,
    queryFn: () => getCurrentSession(),
  });
}
