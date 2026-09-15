import { act, useState } from "react";
import { cdp } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { AUTO_UNFOLD_MS } from "./reveal-panel.tsx";
import { StepExperience, type StepExperienceState } from "./step-experience.tsx";
import type { StepCardData } from "./step-card.tsx";
import type { Media, RevealPreset } from "@/domain/step.ts";

const STEP: StepCardData = {
  name: "QR 01",
  title: "첫 번째 문제",
  body: "서가를 살펴보세요",
  question: "정답은?",
  answerSpec: { type: "SHORT_TEXT" },
};

const INCORRECT_MESSAGE = "아직 사건의 핵심에 도달하지 못했어요. 문장을 다시 살펴보세요.";

/** 실제 화면(/t/$qrToken)처럼 상태를 직접 들고 onSubmit 결과에 따라 갱신한다. */
function setup(onSubmitResult: () => StepExperienceState, onContinue: () => void = () => {}) {
  function Harness() {
    const [state, setState] = useState<StepExperienceState>({ status: "idle" });
    return (
      <StepExperience
        step={STEP}
        state={state}
        onSubmit={async () => setState(onSubmitResult())}
        onRequestHint={async () => undefined}
        onContinue={onContinue}
      />
    );
  }
  return given.render(<Harness />);
}

describe("StepExperience > 오답", () => {
  it("경고가 아닌 안내로 문구를 보여주고, 입력값을 지우지 않는다", async () => {
    await runSiheom(
      setup(() => ({ status: "incorrect", message: INCORRECT_MESSAGE })),
      actions.fill(query.textbox("정답"), "틀린 답"),
      actions.click(query.button("제출하기")),
      assertions.visible(query.status("안내")),
      assertions.textContent(query.status("안내"), INCORRECT_MESSAGE),
      assertions.value(query.textbox("정답"), "틀린 답"),
    );
  });

  it("오답 횟수 제한 없이 계속 다시 시도할 수 있다", async () => {
    let submitCount = 0;

    await runSiheom(
      setup(() => {
        submitCount += 1;
        return { status: "incorrect", message: INCORRECT_MESSAGE };
      }),
      actions.fill(query.textbox("정답"), "1"),
      actions.click(query.button("제출하기")),
      actions.fill(query.textbox("정답"), "2"),
      actions.click(query.button("제출하기")),
      actions.fill(query.textbox("정답"), "3"),
      actions.click(query.button("제출하기")),
      assertions.visible(query.button("제출하기")),
    );

    expect(submitCount).toBe(3);
  });
});

const REVEAL_TEXT = "새 단서 발견";

const REVEAL_PRESETS = [
  "FADE_UP",
  "UNROLL",
  "TYPEWRITER",
  "TV_SCAN",
  "GLITCH",
  "CARD_UNFOLD",
] as const;

/** 연출이 사진에도 걸리는지 보려면 단서에 사진이 있어야 한다 — 네트워크를 타지 않는 1x1 이미지. */
const REVEAL_IMAGE: Media = {
  kind: "image",
  src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  alt: "단서 사진",
};

/** keyframes 이름은 src/theme/keyframes.ts와 1:1로 맞춘다. */
const PRESET_KEYFRAMES: Record<RevealPreset, string> = {
  FADE_UP: "reveal-fade-up",
  UNROLL: "reveal-unroll",
  TYPEWRITER: "reveal-typewriter",
  TV_SCAN: "reveal-tv-scan",
  GLITCH: "reveal-glitch",
  CARD_UNFOLD: "reveal-unfold",
};

function findRevealCard(): HTMLElement {
  // 연출 클래스는 카드에 걸린다 — 사진과 문구를 함께 담은 덩어리.
  const card = document.querySelector<HTMLElement>("[class*=revealAnimation]");
  if (!card) throw new Error("연출이 걸린 단서 카드를 찾지 못했습니다");
  return card;
}

/** 정답 화면까지 진행한 뒤 연출이 걸린 카드를 돌려준다(CARD_UNFOLD는 접힌 채로 나온다). */
async function revealCard(
  preset: RevealPreset,
  reveal: { media?: Media } = {},
): Promise<HTMLElement> {
  await runSiheom(
    setup(() => ({
      status: "correct",
      reveal: { text: REVEAL_TEXT, preset, ...reveal },
      message: "정답이에요!",
    })),
    actions.fill(query.textbox("정답"), "정답"),
    actions.click(query.button("제출하기")),
    assertions.visible(query.heading(REVEAL_TEXT)),
  );

  return findRevealCard();
}

/** 접힌 카드는 클릭이나 자동 펼침 뒤에야 펼침 연출이 걸린다. */
async function waitForUnfolded(card: HTMLElement): Promise<void> {
  if (!card.hasAttribute("data-fold")) return;

  // 자동 펼침은 타이머가 만드는 상태 변화다. act 안에서 타이머가 지나가게 두면
  // act가 그 갱신까지 함께 흘려보내므로, 기다렸다가 결과만 확인하면 된다.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, AUTO_UNFOLD_MS + 120));
  });
  expect(card.hasAttribute("data-fold")).toBe(false);
}

/**
 * CSS의 prefers-reduced-motion은 matchMedia 목킹으로는 바뀌지 않는다 —
 * Chromium의 미디어 에뮬레이션을 직접 켠다(테스트는 chromium에서만 돈다).
 */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  const session = cdp() as { send: (method: string, params?: object) => Promise<unknown> };
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
  });
}

describe("StepExperience > 공개 연출", () => {
  it.each([...REVEAL_PRESETS])(
    "%s 프리셋은 카드 하나에 자기 keyframes로 걸린다",
    async (preset) => {
      const card = await revealCard(preset);
      await waitForUnfolded(card);

      // 클래스만 붙고 CSS가 비어 있으면 "작동하는 것처럼" 보인다 — 실제 애니메이션을 확인한다.
      expect(getComputedStyle(card).animationName).toBe(PRESET_KEYFRAMES[preset]);
    },
  );

  it("연출은 문구뿐 아니라 카드 안의 사진에도 걸린다", async () => {
    const card = await revealCard("UNROLL", { media: REVEAL_IMAGE });

    const image = card.querySelector("img");
    expect(image).not.toBeNull();
    expect(getComputedStyle(image!).animationName).toBe("reveal-media-settle");
  });

  it.each([...REVEAL_PRESETS])("%s: reduced-motion이면 연출 없이 즉시 보인다", async (preset) => {
    await emulateReducedMotion(true);
    try {
      const card = await revealCard(preset);
      const style = getComputedStyle(card);

      expect(style.animationName).toBe("none");
      expect(style.opacity).toBe("1");
      // 접힘·말림은 연출 그 자체라서 아예 만들어지지 않는다 — 카드가 그냥 펼쳐져 있다.
      expect(style.clipPath).toBe("none");
    } finally {
      await emulateReducedMotion(false);
    }
  });

  it("CARD_UNFOLD: 접힌 채로 나오고, 누르면 바로 펼쳐진다", async () => {
    await runSiheom(
      setup(() => ({
        status: "correct",
        reveal: { text: REVEAL_TEXT, preset: "CARD_UNFOLD" },
        message: "정답이에요!",
      })),
      actions.fill(query.textbox("정답"), "정답"),
      actions.click(query.button("제출하기")),
      actions.click(query.button("단서 펼치기")),
    );

    expect(findRevealCard().hasAttribute("data-fold")).toBe(false);
    expect(getComputedStyle(findRevealCard()).animationName).toBe("reveal-unfold");
  });

  it("CARD_UNFOLD: 누르지 않아도 잠시 뒤 스스로 펼쳐진다", async () => {
    const card = await revealCard("CARD_UNFOLD");

    // 접힌 채로 시작하지만 클릭에 갇히지 않는다.
    expect(card.hasAttribute("data-fold")).toBe(true);
    await waitForUnfolded(card);
  });
});

describe("StepExperience > 정답", () => {
  it("공개할 단서를 보여주고, 다음 단서 찾기를 누르면 onContinue를 부른다", async () => {
    let continued = false;

    await runSiheom(
      setup(
        () => ({ status: "correct", reveal: { text: "새 단서 발견" }, message: "정답이에요!" }),
        () => {
          continued = true;
        },
      ),
      actions.fill(query.textbox("정답"), "정답"),
      actions.click(query.button("제출하기")),
      assertions.visible(query.heading("새 단서 발견")),
      actions.click(query.button("다음 단서 찾기")),
    );

    expect(continued).toBe(true);
  });

  it("공개할 단서 문구가 비어 있으면 정답 메시지를 대신 보여준다", async () => {
    await runSiheom(
      setup(() => ({ status: "correct", reveal: {}, message: "정답이에요!" })),
      actions.fill(query.textbox("정답"), "정답"),
      actions.click(query.button("제출하기")),
      assertions.visible(query.heading("정답이에요!")),
    );
  });
});
