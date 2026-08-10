-- Backfill: contas sem dono passam a pertencer ao owner do grupo
UPDATE "accounts" AS a
SET "user_id" = hm."user_id"
FROM "household_members" AS hm
WHERE a."user_id" IS NULL
  AND hm."household_id" = a."household_id"
  AND hm."role" = 'owner';
--> statement-breakpoint
-- Fallback: se não houver owner, usa o primeiro membro do grupo
UPDATE "accounts" AS a
SET "user_id" = (
  SELECT hm."user_id"
  FROM "household_members" AS hm
  WHERE hm."household_id" = a."household_id"
  ORDER BY hm."joined_at" ASC
  LIMIT 1
)
WHERE a."user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
