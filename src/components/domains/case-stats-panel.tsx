import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/domains/empty-state.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Table from "@/components/ui/table.tsx";
import {
  formatPercent,
  type CaseStats,
  type StatsPeriod,
  type StepStats,
} from "@/domain/tourStats.ts";
import { css } from "styled-system/css";
import { Flex, Grid, styled } from "styled-system/jsx";

export type CaseStatsView = CaseStats & {
  caseId: string;
  caseNumber: number;
  caseTitle: string;
  period: StatsPeriod;
};

const PERIODS: { period: StatsPeriod; label: string }[] = [
  { period: "today", label: "오늘" },
  { period: "week", label: "최근 7일" },
  { period: "all", label: "전체" },
];

const StatBox = styled("div", {
  base: {
    borderWidth: "1px",
    borderColor: "border.default",
    borderRadius: "l2",
    p: "4",
  },
});

const StatLabel = styled("p", { base: { textStyle: "sm", color: "fg.subtle" } });
const StatValue = styled("p", { base: { textStyle: "2xl", fontWeight: "bold" } });
const StepName = styled("span", { base: { fontWeight: "medium" } });
const Advice = styled("span", { base: { display: "block", textStyle: "xs", color: "fg.subtle" } });

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

/** 보기 유형이 없는 단계는 정답률 자체가 의미 없으므로 `-`로 둔다. */
function rate(value: number | undefined): string {
  return value === undefined ? "-" : formatPercent(value);
}

function StepRow({ step }: { step: StepStats }) {
  return (
    <Table.Row>
      <Table.Cell>
        <StepName>{step.name}</StepName>
        {/* 숫자만 있으면 조정할 수 없다 — 다음에 무엇을 하면 되는지 한 줄을 붙인다. */}
        <Advice>{step.advice}</Advice>
      </Table.Cell>
      <Table.Cell>{step.reached}</Table.Cell>
      <Table.Cell>
        {step.dropped}
        <Advice>{formatPercent(step.dropRate)} 이탈</Advice>
      </Table.Cell>
      <Table.Cell>{rate(step.firstTryCorrectRate)}</Table.Cell>
      <Table.Cell>{step.hintCount}</Table.Cell>
    </Table.Row>
  );
}

/**
 * 사장님이 난이도를 조정하는 화면(요구 24).
 * 표와 숫자 중심으로 두고, 그래프 라이브러리는 쓰지 않는다 — 숫자 옆 한 줄이면 충분하다.
 */
export function CaseStatsPanel({
  stats,
  period,
  onPeriodChange,
}: {
  stats: CaseStatsView;
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
}) {
  return (
    <Flex direction="column" gap="6" alignItems="stretch">
      <Flex gap="2" role="group" aria-label="기간">
        {PERIODS.map((item) => (
          <Button
            key={item.period}
            size="sm"
            variant={item.period === period ? "solid" : "outline"}
            onClick={() => onPeriodChange(item.period)}
          >
            {item.label}
          </Button>
        ))}
      </Flex>

      <Grid columns={{ base: 2, sm: 4 }} gap="4">
        <Stat label="총 시작 세션" value={stats.started} />
        <Stat label="완료" value={stats.completed} />
        <Stat label="완료율" value={formatPercent(stats.completionRate)} />
        <Stat
          label="평균 플레이 시간"
          value={stats.averageMinutes === undefined ? "-" : `${stats.averageMinutes}분`}
        />
      </Grid>

      {stats.excludedLongSessions > 0 && (
        <p className={css({ textStyle: "sm", color: "fg.subtle" })}>
          {`24시간을 넘긴 ${stats.excludedLongSessions}건은 평균 시간에서 뺐어요.`}
        </p>
      )}

      {stats.started === 0 ? (
        <EmptyState
          icon={<BarChart3 />}
          title="아직 참가 기록이 없어요"
          description="시작 QR을 찍은 참가자가 생기면 여기에 숫자가 쌓입니다. 기간을 바꿔서 확인해보세요."
        />
      ) : (
        <>
          <Grid columns={{ base: 1, sm: 2 }} gap="4">
            <Stat
              label="가장 많이 틀린 단계"
              value={
                stats.hardestStep
                  ? `${stats.hardestStep.name} (첫 시도 정답률 ${formatPercent(stats.hardestStep.firstTryCorrectRate)})`
                  : "아직 없어요"
              }
            />
            <Stat
              label="힌트를 가장 많이 쓴 단계"
              value={
                stats.mostHintedStep
                  ? `${stats.mostHintedStep.name} (힌트 ${stats.mostHintedStep.hintCount}번)`
                  : "아직 없어요"
              }
            />
          </Grid>

          <Table.Root>
            <Table.Head>
              <Table.Row>
                <Table.Header>단계</Table.Header>
                <Table.Header>도달</Table.Header>
                <Table.Header>이탈</Table.Header>
                <Table.Header>첫 시도 정답률</Table.Header>
                <Table.Header>힌트</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {stats.steps.map((step) => (
                <StepRow key={step.stepId} step={step} />
              ))}
            </Table.Body>
          </Table.Root>
        </>
      )}
    </Flex>
  );
}
