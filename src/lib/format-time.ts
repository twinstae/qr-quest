import { BOOKSHOP_TIME_ZONE } from "@/domain/tourStats.ts";

/**
 * 화면에 보이는 시각은 항상 책방 기준(KST)이다 — 배포 서버가 UTC로 돌아도
 * 직원이 보는 "오후 3:12 처리"가 6시간 어긋나면 안 된다.
 */
const clockFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: BOOKSHOP_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const dayFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: BOOKSHOP_TIME_ZONE,
  month: "numeric",
  day: "numeric",
});

export function formatClock(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return clockFormat.format(date);
}

export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dayFormat.format(date);
}
