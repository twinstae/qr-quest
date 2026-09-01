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

export function QuestQrCodeDownload({ questId }: { questId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // window is unavailable during SSR; the correct origin is picked up on the
  // client-side render pass after hydration, before any download can happen.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/quest/${questId}`;

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    triggerDownload(`quest-${questId}.png`, canvas.toDataURL("image/png"));
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
