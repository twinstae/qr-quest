import { createFileRoute } from "@tanstack/react-router";

import { ResetDeviceScreen } from "@/components/domains/reset-device-screen.tsx";
import { getApiClient } from "@/lib/api-client";
import { resetDevice } from "@/lib/reset-device";

export const Route = createFileRoute("/reset")({ component: RouteComponent });

function RouteComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <ResetDeviceScreen
      reset={async () => {
        await resetDevice(async () => {
          const { error } = await getApiClient().play.sessions.delete();
          if (error) throw error;
        });
        // 메모리에 남은 이전 진행 상태도 버린다.
        queryClient.clear();
      }}
    />
  );
}
