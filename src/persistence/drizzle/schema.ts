import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const questGroups = pgTable("quest_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quests = pgTable("quests", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => questGroups.id),
  content: text("content").notNull(),
  imageSrc: text("image_src").notNull(),
  imageAlt: text("image_alt").notNull(),
  answer: text("answer").notNull(),
  alternatives: text("alternatives").array().notNull().default([]),
  placeholder: text("placeholder").notNull(),
  hint: text("hint").notNull(),
  rewardText: text("reward_text"),
  rewardImageSrc: text("reward_image_src"),
  rewardImageAlt: text("reward_image_alt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
