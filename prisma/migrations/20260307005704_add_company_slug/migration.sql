-- AlterTable
ALTER TABLE "Company" ADD COLUMN "slug" TEXT;

-- Backfill existing rows with deterministic slug
UPDATE "Company"
SET "slug" = 'company-' || substring("id" from 1 for 8)
WHERE "slug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");