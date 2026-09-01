CREATE TABLE "quest_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"content" text NOT NULL,
	"image_src" text NOT NULL,
	"image_alt" text NOT NULL,
	"answer" text NOT NULL,
	"alternatives" text[] DEFAULT '{}' NOT NULL,
	"placeholder" text NOT NULL,
	"hint" text NOT NULL,
	"reward_text" text,
	"reward_image_src" text,
	"reward_image_alt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_group_id_quest_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."quest_groups"("id") ON DELETE no action ON UPDATE no action;