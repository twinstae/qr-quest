import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import type { StatsPeriod } from "@/domain/tourStats.ts";
import { getApiClient } from "@/lib/api-client";

export const caseKeys = {
  all: ["cases"] as const,
  lists: () => [...caseKeys.all, "list"] as const,
  detail: (caseId: string) => [...caseKeys.all, "detail", caseId] as const,
  steps: (caseId: string) => [...caseKeys.detail(caseId), "steps"] as const,
  stats: (caseId: string, period: StatsPeriod) => [...caseKeys.detail(caseId), "stats", period] as const,
  byEntry: (entryToken: string) => [...caseKeys.all, "by-entry", entryToken] as const,
};

export const todayStatsKey = ["stats", "today"] as const;

export function caseListQueryOptions() {
  return queryOptions({
    queryKey: caseKeys.lists(),
    queryFn: async () => {
      const { data } = await getApiClient().cases.get();
      return data ?? [];
    },
  });
}

export function todayStatsQueryOptions() {
  return queryOptions({
    queryKey: todayStatsKey,
    queryFn: async () => {
      const { data } = await getApiClient().stats.today.get();
      return data ?? null;
    },
  });
}

export function caseQueryOptions(caseId: string) {
  return queryOptions({
    queryKey: caseKeys.detail(caseId),
    queryFn: async () => {
      const { data } = await getApiClient().cases({ id: caseId }).get();
      if (!data) throw notFound();
      return data;
    },
  });
}

export function caseStepsQueryOptions(caseId: string) {
  return queryOptions({
    queryKey: caseKeys.steps(caseId),
    queryFn: async () => {
      const { data } = await getApiClient().cases({ id: caseId }).steps.get();
      return data ?? [];
    },
  });
}

export function caseStatsQueryOptions(caseId: string, period: StatsPeriod) {
  return queryOptions({
    queryKey: caseKeys.stats(caseId, period),
    queryFn: async () => {
      const { data } = await getApiClient()
        .cases({ id: caseId })
        .stats.get({ query: { period } });
      if (!data) throw notFound();
      return data;
    },
  });
}

export function caseByEntryQueryOptions(entryToken: string) {
  return queryOptions({
    queryKey: caseKeys.byEntry(entryToken),
    queryFn: async () => {
      const { data } = await getApiClient().cases["by-entry"]({ entryToken }).get();
      if (!data) throw notFound();
      return data;
    },
  });
}
