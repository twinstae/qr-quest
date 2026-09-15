import { queryOptions } from "@tanstack/react-query";

import type { PlayProgressResult, PlayStepResult } from "@/application/playService.ts";
import { getApiClient } from "@/lib/api-client";
import { unwrapPlayResult } from "@/lib/play-client";

export const playKeys = {
  step: (qrToken: string) => ["play", "step", qrToken] as const,
  progress: (caseId: string) => ["play", "progress", caseId] as const,
};

export function playStepQueryOptions(qrToken: string) {
  return queryOptions({
    queryKey: playKeys.step(qrToken),
    queryFn: async () => {
      const response = await getApiClient().play.steps.qr({ qrToken }).get();
      return unwrapPlayResult<PlayStepResult>(response);
    },
  });
}

export function playProgressQueryOptions(caseId: string) {
  return queryOptions({
    queryKey: playKeys.progress(caseId),
    queryFn: async () => {
      const response = await getApiClient().play.cases({ caseId }).progress.get();
      return unwrapPlayResult<PlayProgressResult>(response);
    },
  });
}
