import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { caseThemeQueryOptions } from "@/queries/themes.ts";

import { ThemedScreen } from "./themed-screen.tsx";

/** 참가자 화면을 그 CASE의 테마로 감싼다. 라우트 loader가 미리 받아 두면 깜빡이지 않는다. */
export function CaseThemedScreen({ caseId, children }: { caseId: string; children: ReactNode }) {
  const { data: theme } = useQuery(caseThemeQueryOptions(caseId));
  return <ThemedScreen theme={theme ?? null}>{children}</ThemedScreen>;
}
