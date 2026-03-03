-- CreateTable VisitNoteVersion
CREATE TABLE "VisitNoteVersion" (
    "id" TEXT NOT NULL,
    "visitRecordId" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "VisitNoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitNoteVersion_visitRecordId_idx" ON "VisitNoteVersion"("visitRecordId");

-- AddForeignKey
ALTER TABLE "VisitNoteVersion" ADD CONSTRAINT "VisitNoteVersion_visitRecordId_fkey" FOREIGN KEY ("visitRecordId") REFERENCES "VisitRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisitNoteVersion" ADD CONSTRAINT "VisitNoteVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable VisitRecord: add versioning and finalized flag
ALTER TABLE "VisitRecord" ADD COLUMN "currentVersionId" TEXT;
ALTER TABLE "VisitRecord" ADD COLUMN "isFinalized" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: create initial version for each existing VisitRecord and set currentVersionId
INSERT INTO "VisitNoteVersion" ("id", "visitRecordId", "subjective", "objective", "assessment", "plan", "createdAt", "createdById")
SELECT
    gen_random_uuid()::text,
    vr.id,
    vr."subjective",
    vr."objective",
    vr."assessment",
    vr."plan",
    vr."createdAt",
    COALESCE(p."userId", vr."patientId")
FROM "VisitRecord" vr
JOIN "Provider" p ON p.id = vr."providerId";

-- Update VisitRecord.currentVersionId to the first (and only) version per record
-- Use a subquery that picks one version per visitRecordId (min id or min createdAt)
UPDATE "VisitRecord" vr
SET "currentVersionId" = (
    SELECT v.id FROM "VisitNoteVersion" v
    WHERE v."visitRecordId" = vr.id
    ORDER BY v."createdAt" ASC
    LIMIT 1
);

-- Set isFinalized where status was already FINAL
UPDATE "VisitRecord" SET "isFinalized" = true WHERE status = 'FINAL';

-- AddForeignKey VisitRecord.currentVersionId -> VisitNoteVersion.id
ALTER TABLE "VisitRecord" ADD CONSTRAINT "VisitRecord_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "VisitNoteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
