-- CreateTable
CREATE TABLE "ProviderLocationAssignment" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderLocationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientClinicMembership" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "primaryLocationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientClinicMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderLocationAssignment_providerId_locationId_key" ON "ProviderLocationAssignment"("providerId", "locationId");

-- CreateIndex
CREATE INDEX "ProviderLocationAssignment_locationId_idx" ON "ProviderLocationAssignment"("locationId");

-- CreateIndex
CREATE INDEX "ProviderLocationAssignment_providerId_isPrimary_idx" ON "ProviderLocationAssignment"("providerId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Location_clinicId_name_key" ON "Location"("clinicId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PatientClinicMembership_clinicId_patientId_key" ON "PatientClinicMembership"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "PatientClinicMembership_patientId_idx" ON "PatientClinicMembership"("patientId");

-- CreateIndex
CREATE INDEX "PatientClinicMembership_clinicId_isActive_idx" ON "PatientClinicMembership"("clinicId", "isActive");

-- AddForeignKey
ALTER TABLE "ProviderLocationAssignment" ADD CONSTRAINT "ProviderLocationAssignment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLocationAssignment" ADD CONSTRAINT "ProviderLocationAssignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientClinicMembership" ADD CONSTRAINT "PatientClinicMembership_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientClinicMembership" ADD CONSTRAINT "PatientClinicMembership_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientClinicMembership" ADD CONSTRAINT "PatientClinicMembership_primaryLocationId_fkey" FOREIGN KEY ("primaryLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
