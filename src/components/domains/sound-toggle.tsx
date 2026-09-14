import { Volume2, VolumeX } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button.tsx";

/**
 * 효과음 on/off 배지(요구, ticket 15). 기본은 꺼짐 — 조용한 서점에서 갑자기
 * 소리가 나면 안 된다. 실제 재생/저장은 페이지가 주입한다.
 */
export function SoundToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <IconButton
      variant="outline"
      size="sm"
      aria-label={enabled ? "효과음 끄기" : "효과음 켜기"}
      onClick={() => onToggle(!enabled)}
    >
      {enabled ? <Volume2 /> : <VolumeX />}
    </IconButton>
  );
}
