-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "verificationToken" TEXT,
ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetTokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'geral';

-- Backfill existing service categories based on names
UPDATE "Service"
SET "category" = CASE
  WHEN lower("name") LIKE '%lavagem detalhada%' THEN 'lavagem_polimento'
  WHEN lower("name") LIKE '%polimento cristalizado%' THEN 'lavagem_polimento'
  WHEN lower("name") LIKE '%polimento%' THEN 'lavagem_polimento'
  WHEN lower("name") LIKE '%vitrificacao%' OR lower("name") LIKE '%vitrificação%' THEN 'protecao_estetica'
  WHEN lower("name") LIKE '%ppf%' THEN 'protecao_estetica'
  WHEN lower("name") LIKE '%martelinho%' THEN 'reparos_rapidos'
  ELSE 'geral'
END;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_companyId_scheduledAt_key" ON "Appointment"("companyId", "scheduledAt");