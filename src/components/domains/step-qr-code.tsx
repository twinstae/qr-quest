import { useRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button.tsx";
import { Group } from "@/components/ui/group.tsx";
import { Link, QrCode } from "lucide-react";
import * as Clipboard from "@/components/ui/clipboard.tsx";

function triggerDownload(filename: string, href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

function toFileName(label: string): string {
  return label.trim().replace(/\s+/g, "-") || "step";
}

/**
 * 단계 QR은 고정 URL(/t/{qrToken})만 담는다. 질문·정답·이미지를 고쳐도 토큰이
 * 그대로라 이미 붙여 둔 QR을 다시 인쇄할 필요가 없다 (요구 23).
 */
export function StepQrCodeDownload({ qrToken, label }: { qrToken: string; label: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // window is unavailable during SSR; the correct origin is picked up on the
  // client-side render pass after hydration, before any download can happen.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/t/${qrToken}`;

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    triggerDownload(`${toFileName(label)}.png`, canvas.toDataURL("image/png"));
  }

  return (
    <Group>
      <QRCodeSVG ref={svgRef} value={url} size={128} title={url} style={{ display: "none" }} />
      <QRCodeCanvas
        ref={canvasRef}
        value={url}
        size={512}
        title={url}
        style={{ display: "none" }}
      />
      <Clipboard.Root value={url}>
        <Clipboard.Trigger asChild aria-label="URL 복사">
          <Button variant="outline" size="sm">
            <Link /> URL 복사
          </Button>
        </Clipboard.Trigger>
      </Clipboard.Root>
      <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
        <QrCode /> QR
      </Button>
    </Group>
  );
}
