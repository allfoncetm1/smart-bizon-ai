-- Multi-tenancy: each Project now belongs to a User.
-- Added nullable first so this is safe to run against a DB that already
-- has Project rows, then backfilled and locked down to NOT NULL.

ALTER TABLE "Project" ADD COLUMN "userId" TEXT;

-- Generic safe fallback for any pre-existing projects: assign them to the
-- oldest admin account. (On a fresh DB with no rows this UPDATE is a no-op.)
-- Any deliberate reassignment to a specific client account is a separate,
-- explicit data operation done after this migration — not part of it.
UPDATE "Project" p
SET "userId" = (SELECT id FROM "User" WHERE "isAdmin" = true ORDER BY "createdAt" ASC LIMIT 1)
WHERE p."userId" IS NULL
  AND EXISTS (SELECT 1 FROM "User" WHERE "isAdmin" = true);

ALTER TABLE "Project" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Project_userId_idx" ON "Project"("userId");
