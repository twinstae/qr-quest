import { useRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button.tsx";

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

  function downloadSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    triggerDownload(`quest-${questId}.svg`, URL.createObjectURL(blob));
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    triggerDownload(`quest-${questId}.png`, canvas.toDataURL("image/png"));
  }

  return (
    <span>
      <QRCodeSVG ref={svgRef} value={url} size={128} title={url} style={{ display: "none" }} />
      <QRCodeCanvas
        ref={canvasRef}
        value={url}
        size={512}
        title={url}
        style={{ display: "none" }}
      />
      <Button type="button" onClick={downloadSvg}>
        SVG 다운로드
      </Button>
      <Button type="button" onClick={downloadPng}>
        PNG 다운로드
      </Button>
    </span>
  );
}
