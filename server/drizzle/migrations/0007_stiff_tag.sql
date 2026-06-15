ALTER TABLE "households" ADD COLUMN "invite_code" varchar(12);--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_invite_code_unique" UNIQUE("invite_code");