CREATE TYPE "public"."yield_granularity" AS ENUM('daily', 'monthly', 'annual');--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "yield_percent" numeric(8, 4);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "yield_granularity" "yield_granularity";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "maturity_date" date;