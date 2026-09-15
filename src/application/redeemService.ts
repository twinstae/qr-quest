import type { AppContext } from "../api/context.ts";
import { isValidCompletionCode, normalizeCompletionCode } from "../domain/codes.ts";
import type { CompletionCodeStatus } from "../domain/playSession.ts";
import { startOfDayIso } from "../domain/tourStats.ts";

/**
 * 직원이 참가자의 완료 화면을 보고 리워드를 건네줄 때 쓴다(요구 14).
 *
 * 같은 코드로 두 번 받아가지 못하게 서버가 redeemedAt을 한 번만 찍는다 —
 * 화면을 두 번 보여주는 것만으로는 막을 수 없기 때문이다.
 * 판정은 항상 네 갈래 중 하나이고, 화면은 이 결과만 그대로 보여준다.
 */
export async function redeemCompletionCode(
  ctx: AppContext,
  input: { code: string; now?: Date },
): Promise<CompletionCodeStatus> {
  const now = input.now ?? new Date();
  const code = normalizeCompletionCode(input.code);
  if (!isValidCompletionCode(code)) return { kind: "UNKNOWN" };

  const session = await ctx.repo.playSession.getByCompletionCode(code);
  if (!session) return { kind: "UNKNOWN" };
  // 테스트 모드(요구 30-8)에서 만든 코드는 실제 사건이 아니다.
  if (session.isTest) return { kind: "TEST_SESSION" };
  if (session.redeemedAt) {
    return { kind: "ALREADY_REDEEMED", code, redeemedAt: session.redeemedAt };
  }

  await ctx.repo.playSession.update(session.id, { redeemedAt: now.toISOString() });

  const [caseItem, todayCount] = await Promise.all([
    ctx.repo.case.getById(session.caseId),
    ctx.repo.playSession.countRedeemedSince(startOfDayIso(now)),
  ]);

  return {
    kind: "VALID",
    code,
    caseNumber: caseItem?.number ?? 0,
    caseTitle: caseItem?.title ?? "",
    completedAt: session.completedAt,
    todayCount,
  };
}
