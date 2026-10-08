import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import type { IDetectedBarcode, IScannerError } from "@yudiel/react-qr-scanner";
import { Camera, X } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { parseScannedQr, type ScannedQr } from "@/domain/scannedQr.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

// 카메라 라이브러리(바코드 인식 포함)는 첫 화면 번들에 넣지 않는다. 대신 이 안내가
// 보이자마자 미리 받아 두어, 버튼을 눌렀을 때 바로 카메라가 뜨게 한다.
const loadScanner = () => import("@yudiel/react-qr-scanner");
const LazyScanner = lazy(() => loadScanner().then((module) => ({ default: module.Scanner })));

/** 이 화면이 스캐너에 바라는 것. 테스트는 카메라 없이 이 모양의 가짜를 넘긴다. */
export type ScannerComponent = ComponentType<{
  onScan: (codes: IDetectedBarcode[]) => void;
  onError?: (error: IScannerError) => void;
  formats?: ["qr_code"];
  constraints?: MediaTrackConstraints;
  sound?: boolean;
}>;

// 라이브러리 기본값은 가로·세로 최소 640px을 요구해서, 그보다 작은 카메라에서는
// overconstrained로 아예 켜지지 않는다. 최소 없이 원하는 크기만 알려 준다.
const CAMERA_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "environment",
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

const NOT_OUR_QR = "이 QR은 이번 사건의 QR이 아니에요. 사건 QR을 찾아 다시 비춰 주세요.";

/** 카메라를 못 켰을 때: 무엇이 문제인지 + 휴대폰 카메라 앱이라는 다른 길. */
export function cameraErrorMessage(kind: IScannerError["kind"]): string {
  switch (kind) {
    case "permission-denied":
    case "security":
      return "카메라 권한이 꺼져 있어요. 주소창의 자물쇠 버튼에서 카메라를 허용하거나, 휴대폰 기본 카메라 앱으로 QR을 찍어도 돼요.";
    case "in-use":
      return "다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 눌러 주세요.";
    case "no-camera":
      return "이 기기에서 카메라를 찾지 못했어요. 휴대폰 기본 카메라 앱으로 QR을 찍어 주세요.";
    case "insecure-context":
    case "unsupported":
      return "이 브라우저에서는 앱 안 카메라를 쓸 수 없어요. 휴대폰 기본 카메라 앱으로 QR을 찍어 주세요.";
    default:
      return "카메라를 켜지 못했어요. 다시 눌러 보거나, 휴대폰 기본 카메라 앱으로 QR을 찍어도 돼요.";
  }
}

/**
 * 다음 QR을 찾을 차례에 보여준다. 카메라 앱으로 나갔다 오지 않고 이 화면에서 바로 찍는다.
 * 찍힌 QR이 이 앱의 단계·시작 QR이면 onScanned로 넘기고, 잠금 여부는 그 화면(서버)이 판단한다.
 */
export function QrScanPanel({
  stepName,
  anyOrder = false,
  title,
  guide,
  onScanned,
  scanner: Scanner = LazyScanner,
}: {
  stepName: string;
  /** 자유 진행 — 남은 문제 QR을 아무 순서로나 찍으면 된다. */
  anyOrder?: boolean;
  /** 관리자가 적어 둔 찾기 화면 제목·안내. 비어 있으면 기본 문구를 쓴다. */
  title?: string;
  guide?: string;
  onScanned: (target: Exclude<ScannedQr, { kind: "unknown" }>) => void;
  /** 기본은 실제 카메라 스캐너(필요할 때 불러옴). */
  scanner?: ScannerComponent;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadScanner();
  }, []);

  const heading =
    title?.trim() || (anyOrder ? "남은 문제 QR을 찾아주세요" : `다음은 ${stepName} 차례예요`);
  const defaultGuide = anyOrder
    ? "전시실에 붙은 문제 QR 중 하나를 찾으세요. 순서는 상관없어요. 찾았다면 아래 버튼을 눌러 이 화면에서 바로 찍으면 돼요."
    : `전시실에 붙은 QR 코드 중 ${stepName}을(를) 찾아보세요. 찾았다면 아래 버튼을 눌러 이 화면에서 바로 찍으면 돼요.`;
  const findGuide = guide?.trim() || defaultGuide;

  return (
    // 카드 안에 두어야 테마 배경 위에서도 안내 문구가 읽힌다(다른 참가자 화면과 같은 모양).
    <Card.Root variant="elevated" width="full" maxWidth="sm">
      <Card.Body pt="6">
        <VStack gap="4" textAlign="center">
          {/* 관리자가 적은 문구는 줄바꿈까지 그대로 보여준다. */}
          <h2 className={css({ textStyle: "xl", fontWeight: "bold", whiteSpace: "pre-line" })}>
            {heading}
          </h2>
          <p className={css({ color: "fg.muted", whiteSpace: "pre-line" })}>
            {open
              ? "QR 코드가 네모 칸 안에 들어오게 비춰 주세요. 인식되면 바로 다음 화면으로 넘어가요."
              : findGuide}
          </p>

          {open ? (
            <section
              aria-label="QR 카메라"
              className={css({
                width: "full",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                borderRadius: "l3",
                bg: "gray.12",
              })}
            >
              <Suspense
                fallback={
                  <p className={css({ color: "gray.1", p: "6", textStyle: "sm" })}>
                    카메라를 켜고 있어요…
                  </p>
                }
              >
                <Scanner
                  formats={["qr_code"]}
                  constraints={CAMERA_CONSTRAINTS}
                  sound={false}
                  onScan={(codes) => {
                    const raw = codes[0]?.rawValue;
                    if (!raw) return;
                    const target = parseScannedQr(raw);
                    if (target.kind === "unknown") {
                      setMessage(NOT_OUR_QR);
                      return;
                    }
                    setMessage("");
                    onScanned(target);
                  }}
                  onError={(error) => {
                    // 현장 휴대폰에서 원인을 찾을 수 있게 남긴다.
                    console.warn("[qr-scanner]", error.kind, error.message);
                    setOpen(false);
                    setMessage(cameraErrorMessage(error.kind));
                  }}
                />
              </Suspense>
            </section>
          ) : null}

          <p
            role="status"
            aria-label="QR 안내"
            className={css({ textStyle: "sm", color: "fg.muted" })}
          >
            {message}
          </p>

          {open ? (
            <Button variant="outline" width="full" onClick={() => setOpen(false)}>
              <X /> 카메라 닫기
            </Button>
          ) : (
            <Button
              size="lg"
              width="full"
              onClick={() => {
                setMessage("");
                setOpen(true);
              }}
            >
              <Camera /> QR 코드 찍기
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
