-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "slug" SET DEFAULT gen_random_uuid()::text;