CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"palette" text NOT NULL,
	"heading_font" text NOT NULL,
	"body_font" text NOT NULL,
	"background" jsonb,
	"background_dim" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "theme_id" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;