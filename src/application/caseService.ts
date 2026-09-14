import type { AppContext } from "../api/context.ts";
import { defaultStepTemplates, type Case } from "../domain/case.ts";
import { generateQrToken } from "../domain/codes.ts";
import { NotExistError } from "../domain/errors.ts";
import { requiresQrToken, type Media } from "../domain/step.ts";

export type CreateCaseInput = {
  number: number;
  title: string;
  teaser: string;
  intro: string;
  estimatedMinutes?: number;
  thumbnail?: Media;
  finalBookTitle?: string;
  rewardNote?: string;
};

export type UpdateCaseInput = CreateCaseInput;

async function getCaseOrThrow(ctx: AppContext, id: string): Promise<Case> {
  const found = await ctx.repo.case.getById(id);
  if (!found) throw new NotExistError(`Case id=${id} not found`);
  return found;
}

export async function listCases(ctx: AppContext): Promise<Case[]> {
  const cases = await ctx.repo.case.list();
  return [...cases].sort((left, right) => left.number - right.number);
}

export async function getCaseForEdit(ctx: AppContext, id: string): Promise<Case> {
  return getCaseOrThrow(ctx, id);
}

export async function getCaseByEntryToken(ctx: AppContext, token: string): Promise<Case> {
  const found = await ctx.repo.case.getByEntryToken(token);
  if (!found) throw new NotExistError(`Case entryToken=${token} not found`);
  return found;
}

/**
 * 새 CASE를 만들면 사건 소개 → QR 4개 → 마지막 단서 → 사건 종결 뼈대가 함께 생긴다.
 * 관리자가 빈 화면을 마주하지 않게 하고, QR 단계에는 미리 토큰을 붙여 둔다.
 */
export async function createCase(ctx: AppContext, input: CreateCaseInput): Promise<Case> {
  const created = await ctx.repo.case.create({
    number: input.number,
    title: input.title,
    teaser: input.teaser,
    intro: input.intro,
    estimatedMinutes: input.estimatedMinutes ?? 20,
    thumbnail: input.thumbnail,
    status: "DRAFT",
    entryToken: generateQrToken(),
    finalBookTitle: input.finalBookTitle,
    rewardNote: input.rewardNote,
  });

  for (const template of defaultStepTemplates()) {
    await ctx.repo.step.create({
      caseId: created.id,
      order: template.order,
      kind: template.kind,
      name: template.name,
      qrToken: requiresQrToken(template.kind) ? generateQrToken() : null,
      published: true,
      title: template.name,
      body: "",
      reveal: {},
    });
  }

  return created;
}

export async function updateCase(
  ctx: AppContext,
  id: string,
  input: UpdateCaseInput,
): Promise<Case> {
  const existing = await getCaseOrThrow(ctx, id);
  return ctx.repo.case.update(id, {
    ...existing,
    number: input.number,
    title: input.title,
    teaser: input.teaser,
    intro: input.intro,
    estimatedMinutes: input.estimatedMinutes ?? existing.estimatedMinutes,
    thumbnail: input.thumbnail,
    finalBookTitle: input.finalBookTitle,
    rewardNote: input.rewardNote,
  });
}

/**
 * 스키마의 FK는 RESTRICT라 자식(단계)부터 지운다.
 * 단계까지 사라진다는 사실은 화면의 확인 다이얼로그에서 먼저 알린다.
 */
export async function deleteCase(ctx: AppContext, id: string): Promise<void> {
  await ctx.repo.step.deleteByCaseId(id);
  await ctx.repo.case.delete(id);
}
