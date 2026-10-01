import type { AppContext } from "../api/context.ts";
import type { Case } from "../domain/case.ts";
import { NotExistError } from "../domain/errors.ts";
import type { Theme } from "../domain/theme.ts";

export type ThemeInput = Omit<Theme, "id">;

export type ThemeWithUsage = Theme & {
  /** 삭제 경고와 목록의 "n개 CASE에서 사용 중"에 쓴다. */
  usedBy: Pick<Case, "id" | "number" | "title" | "status">[];
};

async function getThemeOrThrow(ctx: AppContext, id: string): Promise<Theme> {
  const found = await ctx.repo.theme.getById(id);
  if (!found) throw new NotExistError(`Theme id=${id} not found`);
  return found;
}

export async function listThemes(ctx: AppContext): Promise<ThemeWithUsage[]> {
  const [themes, cases] = await Promise.all([ctx.repo.theme.list(), ctx.repo.case.list()]);
  return themes.map((theme) => ({
    ...theme,
    usedBy: cases
      .filter((item) => item.themeId === theme.id)
      .map(({ id, number, title, status }) => ({ id, number, title, status })),
  }));
}

export async function getTheme(ctx: AppContext, id: string): Promise<Theme> {
  return getThemeOrThrow(ctx, id);
}

export async function createTheme(ctx: AppContext, input: ThemeInput): Promise<Theme> {
  return ctx.repo.theme.create(input);
}

export async function updateTheme(ctx: AppContext, id: string, input: ThemeInput): Promise<Theme> {
  await getThemeOrThrow(ctx, id);
  return ctx.repo.theme.update(id, input);
}

/**
 * LIVE CASE가 쓰고 있어도 지운다 — 확인 창에서 미리 경고한다.
 * DB FK(set null)에 기대지 않고 직접 떼어 내서, 가짜 저장소에서도 같은 규칙을 지킨다.
 */
export async function deleteTheme(ctx: AppContext, id: string): Promise<void> {
  const cases = await ctx.repo.case.list();
  for (const item of cases.filter((candidate) => candidate.themeId === id)) {
    const { themeId: _detached, ...rest } = item;
    await ctx.repo.case.update(item.id, rest);
  }
  await ctx.repo.theme.delete(id);
}

/** 참가자 화면용. 테마가 없는 CASE는 null — 기본 모습으로 보인다. */
export async function getThemeForCase(ctx: AppContext, caseId: string): Promise<Theme | null> {
  const found = await ctx.repo.case.getById(caseId);
  if (!found) throw new NotExistError(`Case id=${caseId} not found`);
  if (!found.themeId) return null;
  return (await ctx.repo.theme.getById(found.themeId)) ?? null;
}
