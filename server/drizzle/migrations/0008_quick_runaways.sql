ALTER TABLE "households" ALTER COLUMN "default_split_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "households" ALTER COLUMN "default_split_type" SET DEFAULT 'equal'::text;--> statement-breakpoint
DROP TYPE "public"."split_type";--> statement-breakpoint
CREATE TYPE "public"."split_type" AS ENUM('equal', 'percent');--> statement-breakpoint
ALTER TABLE "households" ALTER COLUMN "default_split_type" SET DEFAULT 'equal'::"public"."split_type";--> statement-breakpoint
ALTER TABLE "households" ALTER COLUMN "default_split_type" SET DATA TYPE "public"."split_type" USING "default_split_type"::"public"."split_type";