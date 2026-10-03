import { useState } from "react";

import * as Checkbox from "@/components/ui/checkbox.tsx";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

/** CASE가 정한 진행 규칙 — CASE 상세 화면의 토글이 여기만 바꾼다. */
export type CasePlayOptions = {
  /** 자유 진행(스탬프 투어): 문제를 아무 순서로나 푼다. */
  freeOrder: boolean;
  /** 프로그램 QR: 시작 QR을 찍어야 참여가 시작된다. */
  prologueEnabled: boolean;
  /** 에필로그 QR: 마지막 단서를 풀어야 완주한다. */
  epilogueEnabled: boolean;
};

type OptionKey = keyof CasePlayOptions;

const OPTIONS: { key: OptionKey; label: string; hint: string }[] = [
  {
    key: "freeOrder",
    label: "자유 진행 (스탬프 투어)",
    hint: "문제를 아무 순서로나 풀 수 있어요. 끄면 앞 단계부터 차례대로 열려요.",
  },
  {
    key: "prologueEnabled",
    label: "프로그램 QR로 시작",
    hint: "시작 QR을 찍어야 참여가 시작돼요 — 시작 QR은 결제한 참가자에게만 나눠주세요. 끄면 문제를 하나 풀면 시작해요.",
  },
  {
    key: "epilogueEnabled",
    label: "에필로그 QR로 완주",
    hint: "문제를 다 풀고 마지막 단서 QR을 찍어야 완주해요. 끄면 문제를 다 풀면 바로 완주해요.",
  },
];

/**
 * CASE의 진행 규칙 토글. 한 번에 하나만 누를 수 있게 막아 두어, 요청이 겹쳐
 * 저장 순서가 뒤바뀌지 않게 한다. 실제 저장은 화면이 넘겨주는 onChange가 한다.
 */
export function CasePlayOptionsPanel({
  options,
  onChange,
}: {
  options: CasePlayOptions;
  onChange: (patch: Partial<CasePlayOptions>) => Promise<void>;
}) {
  const [busy, setBusy] = useState<OptionKey | null>(null);

  async function toggle(key: OptionKey): Promise<void> {
    setBusy(key);
    try {
      await onChange({ [key]: !options[key] });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-label="진행 설정"
      className={css({ borderWidth: "1px", borderColor: "border", borderRadius: "l2", p: "4" })}
    >
      <h2 className={css({ textStyle: "lg", fontWeight: "bold", mb: "3" })}>진행 설정</h2>
      <VStack alignItems="stretch" gap="3">
        {OPTIONS.map(({ key, label, hint }) => (
          <div key={key}>
            <Checkbox.Root
              checked={options[key]}
              onCheckedChange={() => void toggle(key)}
              disabled={busy !== null}
            >
              {/* 실제 체크박스 입력 — 없으면 스크린리더와 테스트가 칸을 찾지 못한다. */}
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>{label}</Checkbox.Label>
            </Checkbox.Root>
            <p className={css({ textStyle: "sm", color: "fg.muted", mt: "1" })}>{hint}</p>
          </div>
        ))}
      </VStack>
    </section>
  );
}
