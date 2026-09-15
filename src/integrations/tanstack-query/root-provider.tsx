import { QueryClient } from "@tanstack/react-query";

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      // 페이지를 오갈 때 이미 캐시된 데이터가 있으면 로딩 없이 바로 보여준다 —
      // 30초 안에는 그대로 쓰고, 그 이후엔 백그라운드에서 조용히 새로고침한다.
      queries: { staleTime: 30_000 },
    },
  });

  return {
    queryClient,
  };
}
export default function TanstackQueryProvider() {}
