-- CreateTable
CREATE TABLE "ProviderDiscipline" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,

    CONSTRAINT "ProviderDiscipline_pkey" PRIMARY KEY ("id")
);

-- Migrate existing Provider.disciplineId data to ProviderDiscipline
INSERT INTO "ProviderDiscipline" ("id", "providerId", "disciplineId")
SELECT "id" || '_' || "disciplineId", "id", "disciplineId" FROM "Provider" WHERE "disciplineId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_disciplineId_fkey";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "disciplineId";

-- CreateIndex
CREATE INDEX "ProviderDiscipline_providerId_idx" ON "ProviderDiscipline"("providerId");

-- CreateIndex
CREATE INDEX "ProviderDiscipline_disciplineId_idx" ON "ProviderDiscipline"("disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderDiscipline_providerId_disciplineId_key" ON "ProviderDiscipline"("providerId", "disciplineId");

-- AddForeignKey
ALTER TABLE "ProviderDiscipline" ADD CONSTRAINT "ProviderDiscipline_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderDiscipline" ADD CONSTRAINT "ProviderDiscipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
