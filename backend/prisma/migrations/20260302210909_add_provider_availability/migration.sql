-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "bufferMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProviderAvailability" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderUnavailability" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderUnavailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderAvailability_providerId_idx" ON "ProviderAvailability"("providerId");

-- CreateIndex
CREATE INDEX "ProviderUnavailability_providerId_idx" ON "ProviderUnavailability"("providerId");

-- CreateIndex
CREATE INDEX "ProviderUnavailability_date_idx" ON "ProviderUnavailability"("date");

-- AddForeignKey
ALTER TABLE "ProviderAvailability" ADD CONSTRAINT "ProviderAvailability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUnavailability" ADD CONSTRAINT "ProviderUnavailability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
