/** 라우터 기본 동작. router.tsx가 쓰고, 테스트가 같은 값으로 작은 라우터를 만든다. */
export const ROUTER_DEFAULTS = {
  scrollRestoration: true,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  /**
   * 예전에 들렀던 화면으로 돌아올 때 로더가 끝날 때까지 기다린다.
   *
   * 기본값("background")은 예전 화면을 먼저 보여주고 로더를 뒤에서 다시 돌려서, 정답을 맞히고
   * 진행 화면으로 돌아가면 방금 푼 "QR 01 차례"가 잠깐 보였다가 바뀌었다. 로더는 모두
   * queryClient.query를 쓰므로 캐시가 신선하면 바로 끝나고(기다림 없음), 오래됐거나
   * 무효화됐을 때만 새로 받는 동안 기다린다.
   */
  defaultStaleReloadMode: "blocking",
} as const;
