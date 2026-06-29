ALTER TABLE "accounts" ADD COLUMN "credit_limit" numeric(12,2);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "invoice_closing_day" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "invoice_due_day" integer;
