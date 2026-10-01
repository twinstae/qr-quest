import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Palette, Plus } from "lucide-react";

import { EmptyState } from "@/components/domains/empty-state.tsx";
import { ThemeCard } from "@/components/domains/theme-card.tsx";
import { EMPTY_THEME_VALUES } from "@/components/domains/theme-editor-form.tsx";
import { ThemeFormDialog } from "@/components/domains/theme-form-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { getApiClient } from "@/lib/api-client";
import { caseKeys } from "@/queries/cases.ts";
import { themeKeys, themeListQueryOptions } from "@/queries/themes.ts";
import { css } from "styled-system/css";
import { Flex, Grid, styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/themes/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.query({ ...themeListQueryOptions(), staleTime: "static" });
  },
});

const Main = styled("main", {
  base: { maxWidth: "5xl", marginX: "auto", width: "full", px: "6", py: "10" },
});

const PageTitle = styled("h1", { base: { textStyle: "2xl", fontWeight: "bold" } });

function RouteComponent() {
  const { data: themes } = useQuery(themeListQueryOptions());
  const queryClient = useQueryClient();
  if (!themes) return null;

  // 테마가 바뀌면 CASE 화면(테마 선택·사용 현황)도 다시 읽는다.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: themeKeys.all }),
      queryClient.invalidateQueries({ queryKey: caseKeys.all }),
    ]).then(() => undefined);

  const createDialog = (
    <ThemeFormDialog
      title="테마 추가"
      submitLabel="테마 만들기"
      defaultValues={EMPTY_THEME_VALUES}
      onSave={async (input) => {
        await getApiClient().themes.post(input);
        await refresh();
      }}
      trigger={
        <Button>
          <Plus /> 새 테마 만들기
        </Button>
      }
    />
  );

  return (
    <Main>
      <Link
        to="/admin/cases"
        className={css({ display: "inline-flex", alignItems: "center", gap: "1", mb: "4" })}
      >
        <ChevronLeft /> CASE 목록
      </Link>
      <Flex justify="space-between" align="center" gap="4" mb="6">
        <PageTitle>테마</PageTitle>
        {createDialog}
      </Flex>

      {themes.length === 0 ? (
        <EmptyState
          icon={<Palette />}
          title="아직 만든 테마가 없어요"
          description="테마는 참가자 화면의 색·폰트·배경이에요. 만든 테마는 CASE 편집에서 고를 수 있어요."
          action={createDialog}
        />
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onSave={async (input) => {
                await getApiClient().themes({ id: theme.id }).patch(input);
                await refresh();
              }}
              onDelete={async () => {
                await getApiClient().themes({ id: theme.id }).delete();
                await refresh();
              }}
            />
          ))}
        </Grid>
      )}
    </Main>
  );
}
