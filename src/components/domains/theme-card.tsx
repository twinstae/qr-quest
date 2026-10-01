import { Pencil, Trash2 } from "lucide-react";

import type { ThemeWithUsage } from "@/application/themeService.ts";
import { ConfirmDialog } from "@/components/domains/confirm-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { describeThemeDeletion } from "@/domain/theme.ts";
import { css } from "styled-system/css";

import { toThemeEditorValues, type ThemeInput } from "./theme-editor-form.tsx";
import { ThemeFormDialog } from "./theme-form-dialog.tsx";
import { ThemePreview } from "./theme-preview.tsx";

/** 테마 앨범의 한 장. 미리보기 + 사용 현황 + 수정/삭제. */
export function ThemeCard({
  theme,
  onSave,
  onDelete,
}: {
  theme: ThemeWithUsage;
  onSave: (input: ThemeInput) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { usedBy, ...rest } = theme;

  return (
    <Card.Root variant="outline" aria-label={theme.name} role="article">
      <Card.Body pt="6" alignItems="center">
        <ThemePreview theme={rest} />
      </Card.Body>
      <Card.Header pt="0">
        <Card.Title>{theme.name}</Card.Title>
        <Card.Description>
          {usedBy.length > 0 ? `CASE ${usedBy.length}개에서 사용 중` : "사용하는 CASE 없음"}
        </Card.Description>
      </Card.Header>
      <Card.Footer justifyContent="flex-end" gap="2">
        <ThemeFormDialog
          title="테마 수정"
          submitLabel="저장"
          defaultValues={toThemeEditorValues(rest)}
          onSave={onSave}
          trigger={
            <Button variant="outline" size="sm" aria-label={`${theme.name} 수정`}>
              <Pencil /> 수정
            </Button>
          }
        />
        <ConfirmDialog
          title="테마 삭제"
          description={
            describeThemeDeletion(usedBy) ?? `"${theme.name}" 테마를 삭제할까요? 되돌릴 수 없어요.`
          }
          confirmLabel="삭제하기"
          onConfirm={onDelete}
          trigger={
            <Button variant="outline" size="sm" aria-label={`${theme.name} 삭제`}>
              <Trash2 className={css({ color: "error" })} /> 삭제
            </Button>
          }
        />
      </Card.Footer>
    </Card.Root>
  );
}
