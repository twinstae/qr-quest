import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { CaseStatus } from "../../domain/case.ts";
import type { PlaySessionStatus } from "../../domain/playSession.ts";
import type { AnswerSpec, Media, RevealPreset, SoundKey, StepKind } from "../../domain/step.ts";

/** 정답 시 공개되는 것. 화면이 그대로 렌더할 수 있게 한 덩어리로 저장한다. */
export type StepReveal = {
  text?: string;
  media?: Media;
  preset?: RevealPreset;
  sound?: SoundKey;
};

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** 화면에 보이는 CASE 번호. 1 → CASE 01 */
  number: integer("number").notNull(),
  title: text("title").notNull(),
  teaser: text("teaser").notNull(),
  intro: text("intro").notNull(),
  thumbnail: jsonb("thumbnail").$type<Media>(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(20),
  status: text("status").$type<CaseStatus>().notNull().default("DRAFT"),
  /** 시작 QR의 토큰. /s/{entryToken} */
  entryToken: text("entry_token").notNull().unique(),
  finalBookTitle: text("final_book_title"),
  rewardNote: text("reward_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const steps = pgTable(
  "steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** CASE 안에서의 순서. 0부터 시작한다. */
    order: integer("order").notNull(),
    kind: text("kind").$type<StepKind>().notNull(),
    name: text("name").notNull(),
    /** QR/FINAL 단계만 값을 가진다. URL = /t/{qrToken} */
    qrToken: text("qr_token").unique(),
    published: boolean("published").notNull().default(true),
    title: text("title").notNull(),
    body: text("body").notNull(),
    media: jsonb("media").$type<Media>(),
    reveal: jsonb("reveal").$type<StepReveal>().notNull().default({}),
    question: text("question"),
    answerSpec: jsonb("answer_spec").$type<AnswerSpec>(),
    placeholder: text("placeholder"),
    hint: text("hint"),
    correctMessage: text("correct_message"),
    wrongMessage: text("wrong_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // 순서는 CASE 안에서 위치 그 자체다 — 같은 순서가 둘이면 잠금 판단이 흔들린다.
    uniqueIndex("steps_case_id_order_idx").on(table.caseId, table.order),
  ],
);

export const playSessions = pgTable("play_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  /** httpOnly 쿠키로 내려보내는 추측 불가 토큰. */
  token: text("token").notNull().unique(),
  status: text("status").$type<PlaySessionStatus>().notNull().default("IN_PROGRESS"),
  currentStepOrder: integer("current_step_order").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  completionCode: text("completion_code"),
  redeemedAt: timestamp("redeemed_at"),
  /** 관리자 테스트 모드 세션은 통계에서 제외한다. */
  isTest: boolean("is_test").notNull().default(false),
});

export const stepAttempts = pgTable("step_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => playSessions.id, { onDelete: "cascade" }),
  stepId: uuid("step_id")
    .notNull()
    .references(() => steps.id, { onDelete: "cascade" }),
  /** 제출한 값. 보기 유형이면 고른 보기 id를 이어 붙인 값. */
  submitted: text("submitted").notNull(),
  correct: boolean("correct").notNull(),
  usedHint: boolean("used_hint").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
