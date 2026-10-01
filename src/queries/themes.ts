import { queryOptions } from "@tanstack/react-query";

import { getApiClient } from "@/lib/api-client";

export const themeKeys = {
  all: ["themes"] as const,
  lists: () => [...themeKeys.all, "list"] as const,
  forCase: (caseId: string) => [...themeKeys.all, "for-case", caseId] as const,
};

export function themeListQueryOptions() {
  return queryOptions({
    queryKey: themeKeys.lists(),
    queryFn: async () => {
      const { data } = await getApiClient().themes.get();
      return data ?? [];
    },
  });
}

/** 참가자 화면용. 테마를 못 받아도 기본 모습으로 진행할 수 있게 null로 떨어진다. */
export function caseThemeQueryOptions(caseId: string) {
  return queryOptions({
    queryKey: themeKeys.forCase(caseId),
    queryFn: async () => {
      const { data } = await getApiClient().play.cases({ caseId }).theme.get();
      return data?.theme ?? null;
    },
  });
}
