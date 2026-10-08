import type { ReactNode } from "react";

import type { Theme } from "@/domain/theme.ts";
import { css } from "styled-system/css";

import { ThemedScreen } from "./themed-screen.tsx";

/**
 * 관리자 미리보기를 휴대폰 모양 틀(검은 테두리 + 카메라 노치)에 담는다 — 참가자는 휴대폰으로
 * 보므로, 같은 폭·같은 여백에서 어떻게 보이는지를 바로 알 수 있다. (daisyUI mockup-phone 참고)
 *
 * 화면 높이는 고정이고 넘치는 내용은 화면 안에서 스크롤된다. 실제 화면처럼 내용은 가운데에 서고,
 * CASE 테마가 있으면 참가자 화면과 똑같이 입힌다.
 */
export function PhoneMockup({
  theme = null,
  children,
}: {
  /** CASE 테마(색·폰트·배경). 참가자 화면과 같은 ThemedScreen으로 입힌다. */
  theme?: Theme | null;
  children: ReactNode;
}) {
  return (
    <div
      className={css({
        position: "relative",
        width: "full",
        maxWidth: "22rem",
        mx: "auto",
        p: "2.5",
        bg: "gray.12",
        borderRadius: "2.75rem",
        boxShadow: "lg",
      })}
    >
      {/* 카메라 노치 */}
      <div
        aria-hidden
        className={css({
          position: "absolute",
          top: "4",
          left: "50%",
          transform: "translateX(-50%)",
          width: "6rem",
          height: "1.5rem",
          bg: "gray.12",
          borderRadius: "full",
          zIndex: "1",
        })}
      />
      <div
        role="group"
        aria-label="휴대폰 화면"
        className={css({
          // transform이 있으면 position: fixed인 테마 배경이 브라우저 화면이 아니라 이 화면에 붙는다.
          transform: "translateZ(0)",
          overflow: "hidden",
          bg: "canvas",
          borderRadius: "2.25rem",
        })}
      >
        <ThemedScreen theme={theme}>
          {/* 화면 자체가 아니라 안쪽이 스크롤된다 — 배경은 제자리에 있고 내용만 움직인다. */}
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              height: "min(40rem, 70vh)",
              overflowY: "auto",
            })}
          >
            {/* 실제 참가자 화면(VStack minHeight=screen justify=center p=4)과 같은 배치 — 노치 아래부터. */}
            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4",
                flex: "1",
                px: "4",
                pt: "12",
                pb: "6",
              })}
            >
              {children}
            </div>
          </div>
        </ThemedScreen>
      </div>
    </div>
  );
}
