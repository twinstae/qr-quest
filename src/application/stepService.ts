import type { AppContext } from "../api/context.ts";
import { generateQrToken } from "../domain/codes.ts";
import { NotExistError } from "../domain/errors.ts";
import {
  requiresQrToken,
  toPublicAnswerSpec,
  type AnswerSpec,
  type Media,
  type PublicAnswerSpec,
  type Step,
  type StepKind,
} from "../domain/step.ts";
import type { StepReveal } from "../persistence/drizzle/schema.ts";

export type StepDisplay = {
  id: string;
  caseId: string;
  name: string;
  kind: StepKind;
  order: number;
  title: string;
  body: string;
  media?: Media;
  question?: string;
  answerSpec?: PublicAnswerSpec;
  placeholder?: string;
  hint?: string;
};

/** 참가자에게 보여줄 내용. 정답(보기 정답, 허용 문자열, 키워드)은 절대 담지 않는다. */
export function toStepDisplay(step: Step): StepDisplay {
  return {
    id: step.id,
    caseId: step.caseId,
    name: step.name,
    kind: step.kind,
    order: step.order,
    title: step.title,
    body: step.body,
    media: step.media,
    question: step.question,
    answerSpec: step.answerSpec ? toPublicAnswerSpec(step.answerSpec) : undefined,
    placeholder: step.placeholder,
    hint: step.hint,
  };
}

export type StepEditorInput = {
  name: string;
  kind: StepKind;
  title: string;
  body: string;
  media?: Media;
  reveal: StepReveal;
  question?: string;
  answerSpec?: AnswerSpec;
  placeholder?: string;
  hint?: string;
  correctMessage?: string;
  wrongMessage?: string;
};

export type StepSummary = {
  id: string;
  order: number;
  kind: StepKind;
  name: string;
  qrToken: string | null;
  published: boolean;
  title: string;
  hasAnswer: boolean;
};

async function getStepOrThrow(ctx: AppContext, id: string): Promise<Step> {
  const step = await ctx.repo.step.getById(id);
  if (!step) throw new NotExistError(`Step id=${id} not found`);
  return step;
}

/** 관리자 목록용. 정답을 화면에 보여줘야 하므로 요약에는 담지 않는다. */
export async function listSteps(ctx: AppContext, caseId: string): Promise<StepSummary[]> {
  const steps = await ctx.repo.step.listByCaseId(caseId);
  return steps.map((step) => ({
    id: step.id,
    order: step.order,
    kind: step.kind,
    name: step.name,
    qrToken: step.qrToken,
    published: step.published,
    title: step.title,
    hasAnswer: step.answerSpec !== undefined,
  }));
}

export async function getStepForEdit(ctx: AppContext, id: string): Promise<Step> {
  return getStepOrThrow(ctx, id);
}

export async function createStep(
  ctx: AppContext,
  caseId: string,
  input: StepEditorInput,
): Promise<Step> {
  const order = await ctx.repo.step.nextOrder(caseId);
  return ctx.repo.step.create({
    caseId,
    order,
    name: input.name,
    kind: input.kind,
    qrToken: requiresQrToken(input.kind) ? generateQrToken() : null,
    published: true,
    title: input.title,
    body: input.body,
    media: input.media,
    reveal: input.reveal,
    question: input.question,
    answerSpec: input.answerSpec,
    placeholder: input.placeholder,
    hint: input.hint,
    correctMessage: input.correctMessage,
    wrongMessage: input.wrongMessage,
  });
}

export async function updateStep(
  ctx: AppContext,
  id: string,
  input: StepEditorInput,
): Promise<Step> {
  const existing = await getStepOrThrow(ctx, id);
  // QR 토큰은 절대 다시 만들지 않는다 — 내용을 고쳐도 인쇄한 QR을 그대로 쓴다(요구 23).
  const qrToken = requiresQrToken(input.kind) ? (existing.qrToken ?? generateQrToken()) : null;

  return ctx.repo.step.update(id, {
    order: existing.order,
    kind: input.kind,
    name: input.name,
    qrToken,
    published: existing.published,
    title: input.title,
    body: input.body,
    media: input.media,
    reveal: input.reveal,
    question: input.question,
    answerSpec: input.answerSpec,
    placeholder: input.placeholder,
    hint: input.hint,
    correctMessage: input.correctMessage,
    wrongMessage: input.wrongMessage,
  });
}
