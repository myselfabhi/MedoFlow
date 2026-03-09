-- CreateEnum
CREATE TYPE "AIScribeStatus" AS ENUM ('RECORDING', 'TRANSCRIBING', 'DRAFT_GENERATED', 'EDITED', 'APPROVED');

-- CreateTable
CREATE TABLE "AIScribeSession" (
    "id" TEXT NOT NULL,
    "visitRecordId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcript" TEXT,
    "aiDraft" JSONB,
    "patientSummary" JSONB,
    "status" "AIScribeStatus" NOT NULL DEFAULT 'RECORDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIScribeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIScribeSession_visitRecordId_idx" ON "AIScribeSession"("visitRecordId");

-- CreateIndex
CREATE INDEX "AIScribeSession_providerId_idx" ON "AIScribeSession"("providerId");

-- CreateIndex
CREATE INDEX "AIScribeSession_clinicId_idx" ON "AIScribeSession"("clinicId");

-- AddForeignKey
ALTER TABLE "AIScribeSession" ADD CONSTRAINT "AIScribeSession_visitRecordId_fkey" FOREIGN KEY ("visitRecordId") REFERENCES "VisitRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIScribeSession" ADD CONSTRAINT "AIScribeSession_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIScribeSession" ADD CONSTRAINT "AIScribeSession_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
