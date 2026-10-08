import { queryOptions, type QueryClient } from "@tanstack/react-query";

import type {
  PlayProgressResult,
  PlayStepResult,
  SubmitAnswerResult,
} from "@/application/playService.ts";
import type { AnswerSubmission } from "@/domain/step.ts";
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

/**
 * 정답을 제출한다. 정답이면 진행(스탬프판·다음 차례)이 서버에서 바뀌므로 그 CASE의 진행 캐시를
 * 무효화한다 — 그러지 않으면 [다음 단서 찾기]로 돌아간 진행 화면이 캐시(기본 30초)에 남은
 * 옛 진행을 보여줘, 방금 푼 QR을 또 찾으라고 한다.
 */
export async function submitPlayAnswer(
  queryClient: QueryClient,
  step: { id: string; caseId: string },
  submission: AnswerSubmission,
): Promise<SubmitAnswerResult> {
  const response = await getApiClient()
    .play.steps({ id: step.id })
    ["submit-answer"].post(
      submission.type === "CHOICE"
        ? { choiceIds: submission.choiceIds }
        : { answer: submission.value },
    );
  const outcome = unwrapPlayResult<SubmitAnswerResult>(response);

  if (outcome.kind === "CORRECT") {
    await queryClient.invalidateQueries({ queryKey: playKeys.progress(step.caseId) });
  }
  return outcome;
}
