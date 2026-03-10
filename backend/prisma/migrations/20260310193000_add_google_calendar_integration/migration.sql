-- CreateTable
CREATE TABLE "GoogleCalendarConnection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "tokenType" TEXT,
  "scope" TEXT,
  "expiryDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleCalendarEvent" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "providerId" TEXT,
  "googleEventId" TEXT NOT NULL,
  "summary" TEXT,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "meetLink" TEXT,
  "status" TEXT NOT NULL,
  "appointmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarConnection_userId_clinicId_key" ON "GoogleCalendarConnection"("userId", "clinicId");
CREATE INDEX "GoogleCalendarConnection_clinicId_idx" ON "GoogleCalendarConnection"("clinicId");
CREATE UNIQUE INDEX "GoogleCalendarEvent_connectionId_googleEventId_key" ON "GoogleCalendarEvent"("connectionId", "googleEventId");
CREATE INDEX "GoogleCalendarEvent_clinicId_startTime_idx" ON "GoogleCalendarEvent"("clinicId", "startTime");
CREATE INDEX "GoogleCalendarEvent_providerId_startTime_idx" ON "GoogleCalendarEvent"("providerId", "startTime");

-- AddForeignKey
ALTER TABLE "GoogleCalendarConnection"
ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoogleCalendarConnection"
ADD CONSTRAINT "GoogleCalendarConnection_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoogleCalendarEvent"
ADD CONSTRAINT "GoogleCalendarEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleCalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoogleCalendarEvent"
ADD CONSTRAINT "GoogleCalendarEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoogleCalendarEvent"
ADD CONSTRAINT "GoogleCalendarEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
