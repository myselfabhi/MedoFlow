import re

with open("backend/prisma/schema.prisma", "r") as f:
    content = f.read()

enums = """enum CartStatus {
  ACTIVE
  CHECKED_OUT
  ABANDONED
}

enum CartItemType {
  SERVICE
  PRODUCT
  PACKAGE
  MEMBERSHIP
}

enum PackageStatus {
  ACTIVE
  EXHAUSTED
  EXPIRED
  CANCELLED
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
}

enum CommissionType {
  PERCENTAGE
  FLAT_RATE
}

enum CommissionItemType {
  ALL
  SERVICE
  PRODUCT
  PACKAGE
}

enum CommissionStatus {
  PENDING
  PAID
  CANCELLED
}

"""
content = content.replace("enum ConsentStatus {\n  PENDING\n  GRANTED\n  DECLINED\n}\n", "enum ConsentStatus {\n  PENDING\n  GRANTED\n  DECLINED\n}\n\n" + enums)

def add_to_model(model_name, additions):
    global content
    pattern = r'(model ' + model_name + r' \{.*?)(^\})'
    replacement = r'\1' + additions + r'\n\2'
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

add_to_model("Clinic", "  carts                     Cart[]\n  commissionRules           CommissionRule[]\n  commissionRecords         CommissionRecord[]")
add_to_model("User", '  carts                         Cart[]                     @relation("PatientCarts")\n  patientPackages               PatientPackage[]           @relation("PatientPackages")\n  patientSubscriptions          PatientSubscription[]      @relation("PatientSubscriptions")')
add_to_model("Service", "  cartItems         CartItem[]\n  commissionRules   CommissionRule[]")
add_to_model("Product", "  cartItems         CartItem[]\n  commissionRules   CommissionRule[]\n  invoiceItems      InvoiceItem[]")
add_to_model("Package", "  cartItems         CartItem[]\n  commissionRules   CommissionRule[]\n  invoiceItems      InvoiceItem[]\n  patientPackages   PatientPackage[]")
add_to_model("Membership", "  cartItems            CartItem[]\n  patientSubscriptions PatientSubscription[]")
add_to_model("Appointment", "  cartItem             CartItem?\n  packageSessionUsages PackageSessionUsage[]")
add_to_model("Provider", "  commissionRules        CommissionRule[]\n  commissionRecords      CommissionRecord[]")

# Update Invoice
content = re.sub(r'(model Invoice \{.*?appointmentId\s+)String', r'\1String?', content, flags=re.DOTALL)
content = re.sub(r'(model Invoice \{.*?appointment\s+Appointment\s+)@', r'\1?   @', content, flags=re.DOTALL)
add_to_model("Invoice", "  commissionRecords CommissionRecord[]")

# Update InvoiceItem
content = re.sub(r'(model InvoiceItem \{.*?serviceId\s+)String', r'\1String?', content, flags=re.DOTALL)
content = re.sub(r'(model InvoiceItem \{.*?service\s+Service\s+)@', r'\1? @', content, flags=re.DOTALL)
add_to_model("InvoiceItem", "  productId    String?\n  packageId    String?\n  product Product? @relation(fields: [productId], references: [id], onDelete: Restrict)\n  package Package? @relation(fields: [packageId], references: [id], onDelete: Restrict)\n  commissionRecords CommissionRecord[]")
content = content.replace("  @@index([serviceId])", "  @@index([serviceId])\n  @@index([productId])\n  @@index([packageId])")

# Update Payment
content = re.sub(r'(model Payment \{.*?appointmentId\s+)String', r'\1String?', content, flags=re.DOTALL)
content = re.sub(r'(model Payment \{.*?appointment\s+Appointment\s+)@', r'\1? @', content, flags=re.DOTALL)

new_models = """
// --- MODULE 4: COMMERCE & REVENUE ENGINE ADDITIONS ---

model Cart {
  id          String     @id @default(cuid())
  clinicId    String
  patientId   String
  status      CartStatus @default(ACTIVE)
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  clinic      Clinic     @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  patient     User       @relation("PatientCarts", fields: [patientId], references: [id], onDelete: Cascade)
  items       CartItem[]

  @@index([clinicId, patientId, status])
  @@index([clinicId])
  @@index([patientId])
}

model CartItem {
  id            String       @id @default(cuid())
  cartId        String
  itemType      CartItemType
  quantity      Int          @default(1)
  unitPrice     Decimal      @db.Decimal(10, 2)

  serviceId     String?
  productId     String?
  packageId     String?
  membershipId  String?

  appointmentId String?      @unique

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  cart          Cart         @relation(fields: [cartId], references: [id], onDelete: Cascade)
  service       Service?     @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  product       Product?     @relation(fields: [productId], references: [id], onDelete: SetNull)
  package       Package?     @relation(fields: [packageId], references: [id], onDelete: SetNull)
  membership    Membership?  @relation(fields: [membershipId], references: [id], onDelete: SetNull)
  appointment   Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

  @@index([cartId])
  @@index([serviceId])
  @@index([productId])
  @@index([packageId])
  @@index([membershipId])
}

model PatientPackage {
  id             String        @id @default(cuid())
  clinicId       String
  patientId      String
  packageId      String
  invoiceId      String?
  status         PackageStatus @default(ACTIVE)
  totalSessions  Int
  usedSessions   Int           @default(0)
  expiresAt      DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  patient    User                  @relation("PatientPackages", fields: [patientId], references: [id], onDelete: Cascade)
  package    Package               @relation(fields: [packageId], references: [id], onDelete: Cascade)
  sessions   PackageSessionUsage[] 

  @@index([patientId, status])
  @@index([clinicId])
}

model PackageSessionUsage {
  id               String   @id @default(cuid())
  patientPackageId String
  appointmentId    String   @unique
  usedAt           DateTime @default(now())

  patientPackage PatientPackage @relation(fields: [patientPackageId], references: [id], onDelete: Cascade)
  appointment    Appointment    @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
}

model PatientSubscription {
  id                   String             @id @default(cuid())
  clinicId             String
  patientId            String
  membershipId         String
  stripeSubscriptionId String?
  status               SubscriptionStatus
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  patient    User       @relation("PatientSubscriptions", fields: [patientId], references: [id], onDelete: Cascade)
  membership Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)

  @@index([patientId, status])
  @@index([clinicId])
}

model CommissionRule {
  id              String             @id @default(cuid())
  clinicId        String
  providerId      String?            
  itemType        CommissionItemType @default(ALL)
  serviceId       String?            
  productId       String?            
  packageId       String?            
  commissionType  CommissionType
  commissionValue Decimal            @db.Decimal(10, 2)
  isActive        Boolean            @default(true)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  clinic   Clinic    @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  provider Provider? @relation(fields: [providerId], references: [id], onDelete: Cascade)
  service  Service?  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  product  Product?  @relation(fields: [productId], references: [id], onDelete: Cascade)
  package  Package?  @relation(fields: [packageId], references: [id], onDelete: Cascade)

  records CommissionRecord[]

  @@index([clinicId])
  @@index([providerId])
  @@index([itemType])
}

model CommissionRecord {
  id              String           @id @default(cuid())
  clinicId        String
  providerId      String
  invoiceId       String           
  invoiceItemId   String           
  ruleId          String?          
  basisAmount     Decimal          @db.Decimal(10, 2) 
  amount          Decimal          @db.Decimal(10, 2) 
  status          CommissionStatus @default(PENDING)
  earnedAt        DateTime         
  paidOutAt       DateTime?        
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  clinic      Clinic          @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  provider    Provider        @relation(fields: [providerId], references: [id], onDelete: Restrict)
  invoice     Invoice         @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  invoiceItem InvoiceItem     @relation(fields: [invoiceItemId], references: [id], onDelete: Cascade)
  rule        CommissionRule? @relation(fields: [ruleId], references: [id], onDelete: SetNull)

  @@index([clinicId])
  @@index([providerId])
  @@index([invoiceId])
  @@index([status])
  @@index([earnedAt])
}
"""

content += new_models

with open("backend/prisma/schema.prisma", "w") as f:
    f.write(content)

