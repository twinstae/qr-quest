import { useEffect } from "react";

/** 진행 중 화면이 꺼지지 않게 한다(요구). 지원하지 않는 브라우저는 조용히 무시한다. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | undefined;
    let cancelled = false;

    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
      })
      .catch(() => {
        // 지원하지 않거나 거부된 경우 — 화면은 계속 꺼질 수 있지만 기능은 그대로 동작한다.
      });

    return () => {
      cancelled = true;
      void sentinel?.release();
    };
  }, [active]);
}
