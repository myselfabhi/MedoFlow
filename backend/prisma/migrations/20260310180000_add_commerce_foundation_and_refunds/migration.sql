-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "refundForPaymentId" TEXT;

-- CreateTable
CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sku" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantityInStock" INTEGER NOT NULL DEFAULT 0,
  "reorderThreshold" INTEGER,
  "supplier" TEXT,
  "batchNumber" TEXT,
  "expiryDate" TIMESTAMP(3),
  "storageLocation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "totalSessions" INTEGER,
  "expiresInDays" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "monthlyPrice" DECIMAL(10,2) NOT NULL,
  "billingPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_clinicId_name_key" ON "Product"("clinicId", "name");
CREATE INDEX "Product_clinicId_idx" ON "Product"("clinicId");
CREATE UNIQUE INDEX "InventoryItem_productId_key" ON "InventoryItem"("productId");
CREATE INDEX "InventoryItem_clinicId_idx" ON "InventoryItem"("clinicId");
CREATE UNIQUE INDEX "Package_clinicId_name_key" ON "Package"("clinicId", "name");
CREATE INDEX "Package_clinicId_idx" ON "Package"("clinicId");
CREATE UNIQUE INDEX "Membership_clinicId_name_key" ON "Membership"("clinicId", "name");
CREATE INDEX "Membership_clinicId_idx" ON "Membership"("clinicId");
CREATE INDEX "Payment_refundForPaymentId_idx" ON "Payment"("refundForPaymentId");

-- AddForeignKey
ALTER TABLE "Product"
ADD CONSTRAINT "Product_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryItem"
ADD CONSTRAINT "InventoryItem_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryItem"
ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Package"
ADD CONSTRAINT "Package_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
