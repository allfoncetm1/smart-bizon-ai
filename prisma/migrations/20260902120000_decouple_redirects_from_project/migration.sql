-- Link Preview redirects no longer require a connected Bizon365 project —
-- they belong to the account directly. projectId becomes an optional,
-- best-effort reference (kept for existing rows / future organization)
-- instead of a hard requirement.

-- 1. Add userId, nullable for now so this is safe on any existing rows.
ALTER TABLE "LinkRedirect" ADD COLUMN "userId" TEXT;

-- 2. Backfill from the project every existing redirect currently belongs to.
UPDATE "LinkRedirect" lr
SET "userId" = p."userId"
FROM "Project" p
WHERE lr."projectId" = p.id
  AND lr."userId" IS NULL;

-- 3. Lock it down now that every row has an owner.
ALTER TABLE "LinkRedirect" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "LinkRedirect" ADD CONSTRAINT "LinkRedirect_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LinkRedirect_userId_idx" ON "LinkRedirect"("userId");

-- 4. projectId becomes optional: drop the old CASCADE fk, allow NULL, and
-- re-add the fk as SET NULL so deleting a project no longer deletes its
-- redirects — it just detaches them.
ALTER TABLE "LinkRedirect" DROP CONSTRAINT "LinkRedirect_projectId_fkey";
ALTER TABLE "LinkRedirect" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "LinkRedirect" ADD CONSTRAINT "LinkRedirect_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
