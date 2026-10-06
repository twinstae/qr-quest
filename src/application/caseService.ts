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
  themeId?: string;
  /** 자유 진행(스탬프 투어). 없으면 새로 만드는 CASE는 자유 진행으로 시작한다. */
  freeOrder?: boolean;
  /** 프롤로그 QR로 참여 시작. */
  prologueEnabled?: boolean;
  /** 에필로그 QR로 완주. */
  epilogueEnabled?: boolean;
};

export type UpdateCaseInput = CreateCaseInput;

/** 진행 규칙만 따로 바꿀 때 쓴다 — CASE 상세 화면의 토글이 여기만 보낸다. */
export type CasePlayOptionsPatch = Partial<
  Pick<Case, "freeOrder" | "prologueEnabled" | "epilogueEnabled">
>;

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
    themeId: input.themeId,
    // 새 CASE는 기본으로 스탬프 투어(자유 진행) + 프로그램/에필로그 QR를 쓴다.
    freeOrder: input.freeOrder ?? true,
    prologueEnabled: input.prologueEnabled ?? true,
    epilogueEnabled: input.epilogueEnabled ?? true,
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
    themeId: input.themeId,
    freeOrder: input.freeOrder ?? existing.freeOrder,
    prologueEnabled: input.prologueEnabled ?? existing.prologueEnabled,
    epilogueEnabled: input.epilogueEnabled ?? existing.epilogueEnabled,
  });
}

/** CASE 상세 화면의 진행 설정 토글. 보낸 항목만 바꾸고 나머지는 그대로 둔다. */
export async function setCasePlayOptions(
  ctx: AppContext,
  id: string,
  patch: CasePlayOptionsPatch,
): Promise<Case> {
  const existing = await getCaseOrThrow(ctx, id);
  return ctx.repo.case.update(id, { ...existing, ...patch });
}

export type StartScreenInput = {
  title: string;
  teaser: string;
  estimatedMinutes: number;
  startNote?: string;
  startButtonLabel?: string;
};

/** 시작 QR을 찍으면 보이는 화면의 문구. 빈 문구는 저장하지 않아 화면이 기본값을 쓴다. */
export async function updateStartScreen(
  ctx: AppContext,
  id: string,
  input: StartScreenInput,
): Promise<Case> {
  const existing = await getCaseOrThrow(ctx, id);
  return ctx.repo.case.update(id, {
    ...existing,
    title: input.title,
    teaser: input.teaser,
    estimatedMinutes: input.estimatedMinutes,
    startNote: input.startNote?.trim() || undefined,
    startButtonLabel: input.startButtonLabel?.trim() || undefined,
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
