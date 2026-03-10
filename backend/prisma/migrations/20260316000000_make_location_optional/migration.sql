-- AlterTable: Make locationId optional for online-only clinics
ALTER TABLE "Appointment" ALTER COLUMN "locationId" DROP NOT NULL;
ALTER TABLE "SlotHold" ALTER COLUMN "locationId" DROP NOT NULL;
