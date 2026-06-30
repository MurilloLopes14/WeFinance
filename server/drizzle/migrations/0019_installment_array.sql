ALTER TABLE "subscriptions" DROP COLUMN "installments_generated";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "generated_installments" jsonb DEFAULT '[]'::jsonb NOT NULL;
