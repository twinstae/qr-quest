import { useState } from "react";

const STORAGE_KEY = "qr-quest-sound-enabled";

/** 효과음 on/off는 기본 꺼짐이고, 세션(탭) 안에서는 선택을 기억한다(요구, ticket 15). */
export function useSoundPreference(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(STORAGE_KEY) === "true";
  });

  function update(next: boolean) {
    setEnabled(next);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, String(next));
    }
  }

  return [enabled, update];
}
