import { css } from "styled-system/css";
import { Grid, styled } from "styled-system/jsx";

const StatBox = styled("div", {
  base: {
    borderWidth: "1px",
    borderColor: "border.default",
    borderRadius: "l2",
    p: "4",
  },
});

const StatLabel = styled("p", {
  base: {
    textStyle: "sm",
    color: "fg.subtle",
  },
});

const StatValue = styled("p", {
  base: {
    textStyle: "2xl",
    fontWeight: "bold",
  },
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <StatBox>
      <StatLabel>{label}</StatLabel>
      <StatValue role="status" aria-label={label}>
        {value}
      </StatValue>
    </StatBox>
  );
}

/** 오늘 참가·완료는 16 전까지 통계를 낼 수 없어 "-"로 둔다. */
export function DashboardSummary({ liveCount, totalCount }: { liveCount: number; totalCount: number }) {
  return (
    <Grid columns={{ base: 2, sm: 4 }} gap="4" className={css({ mb: "8" })}>
      <Stat label="진행 중인 CASE" value={liveCount} />
      <Stat label="전체 CASE" value={totalCount} />
      <Stat label="오늘 참가" value="-" />
      <Stat label="오늘 완료" value="-" />
    </Grid>
  );
}
