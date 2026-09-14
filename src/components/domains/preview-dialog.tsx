import { useState } from "react";
import { Eye } from "lucide-react";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import { Button } from "@/components/ui/button.tsx";
import { css } from "styled-system/css";
import { Flex, VStack } from "styled-system/jsx";

type FrameMode = "PC" | "MOBILE";

const FRAME_WIDTH: Record<FrameMode, string> = { PC: "100%", MOBILE: "375px" };
const FRAME_LABEL: Record<FrameMode, string> = { PC: "PC 화면", MOBILE: "모바일 화면" };

/**
 * 저장하지 않은 초안 상태 그대로 참가자 화면을 PC/모바일 프레임으로 보여준다(요구 30-7).
 * 실제 렌더는 별도 라우트(/admin/preview/$stepId)에 맡기고 iframe으로 담는다 —
 * 스타일이 완전히 분리된 독립 문서라야 "참가자가 실제로 보는 화면"과 같아진다.
 */
export function PreviewDialog({ previewUrl }: { previewUrl: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<FrameMode>("PC");

  return (
    <DialogShell
      title="미리보기"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline" size="sm">
          <Eye /> 미리보기
        </Button>
      }
    >
      <VStack alignItems="stretch" gap="3">
        <Flex justify="space-between" align="center">
          <Flex gap="1">
            <Button
              size="sm"
              variant={mode === "PC" ? "solid" : "outline"}
              aria-pressed={mode === "PC"}
              onClick={() => setMode("PC")}
            >
              PC
            </Button>
            <Button
              size="sm"
              variant={mode === "MOBILE" ? "solid" : "outline"}
              aria-pressed={mode === "MOBILE"}
              onClick={() => setMode("MOBILE")}
            >
              모바일
            </Button>
          </Flex>
          <span role="status" aria-label="현재 화면" className={css({ textStyle: "xs", color: "fg.subtle" })}>
            {FRAME_LABEL[mode]}
          </span>
        </Flex>

        <div
          className={css({
            mx: "auto",
            width: "full",
            borderWidth: "1px",
            borderColor: "border",
            borderRadius: "md",
            overflow: "hidden",
            bg: "gray.subtle.bg",
          })}
          style={{ maxWidth: FRAME_WIDTH[mode] }}
        >
          {open && (
            <iframe
              src={previewUrl}
              title="참가자 화면 미리보기"
              className={css({ width: "full", height: "600px", border: "none" })}
            />
          )}
        </div>
      </VStack>
    </DialogShell>
  );
}
