import type { ReactNode } from "react";

import { css } from "styled-system/css";

/**
 * 관리자 미리보기를 휴대폰 모양 틀(검은 테두리 + 카메라 노치)에 담는다 — 참가자는 휴대폰으로
 * 보므로, 같은 폭·같은 여백에서 어떻게 보이는지를 바로 알 수 있다. (daisyUI mockup-phone 참고)
 *
 * 화면 높이는 고정이고 넘치는 내용은 화면 안에서 스크롤된다. 실제 화면처럼 내용은 가운데에 선다.
 */
export function PhoneMockup({ children }: { children: ReactNode }) {
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
          display: "flex",
          flexDirection: "column",
          height: "min(40rem, 70vh)",
          overflowY: "auto",
          bg: "canvas",
          borderRadius: "2.25rem",
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
    </div>
  );
}
