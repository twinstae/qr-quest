ALTER TABLE "cases" ADD COLUMN "free_order" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "prologue_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "epilogue_enabled" boolean DEFAULT true NOT NULL;