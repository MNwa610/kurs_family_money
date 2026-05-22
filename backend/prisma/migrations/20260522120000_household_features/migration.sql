-- CreateEnum not needed

CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Моя семья',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdInvite" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdInvite_pkey" PRIMARY KEY ("id")
);

DO $$
DECLARE
  r RECORD;
  hid TEXT;
  mid TEXT;
BEGIN
  FOR r IN SELECT "id", "name" FROM "User" LOOP
    hid := gen_random_uuid()::text;
    mid := gen_random_uuid()::text;
    INSERT INTO "Household" ("id", "name", "createdAt", "updatedAt")
    VALUES (hid, COALESCE(r."name", 'Моя семья'), NOW(), NOW());
    INSERT INTO "HouseholdMember" ("id", "householdId", "userId", "role", "createdAt")
    VALUES (mid, hid, r."id", 'owner', NOW());
  END LOOP;
END $$;

ALTER TABLE "FamilyMember" ADD COLUMN "householdId" TEXT;
UPDATE "FamilyMember" fm
SET "householdId" = hm."householdId"
FROM "HouseholdMember" hm
WHERE fm."userId" = hm."userId";
ALTER TABLE "FamilyMember" DROP CONSTRAINT "FamilyMember_userId_fkey";
ALTER TABLE "FamilyMember" DROP COLUMN "userId";
ALTER TABLE "FamilyMember" ALTER COLUMN "householdId" SET NOT NULL;

ALTER TABLE "IncomeType" ADD COLUMN "householdId" TEXT;
UPDATE "IncomeType" it
SET "householdId" = hm."householdId"
FROM "HouseholdMember" hm
WHERE it."userId" = hm."userId";
ALTER TABLE "IncomeType" DROP CONSTRAINT "IncomeType_userId_fkey";
DROP INDEX "IncomeType_userId_name_key";
ALTER TABLE "IncomeType" DROP COLUMN "userId";
ALTER TABLE "IncomeType" ALTER COLUMN "householdId" SET NOT NULL;

ALTER TABLE "ExpenseCategory" ADD COLUMN "householdId" TEXT;
UPDATE "ExpenseCategory" ec
SET "householdId" = hm."householdId"
FROM "HouseholdMember" hm
WHERE ec."userId" = hm."userId";
ALTER TABLE "ExpenseCategory" DROP CONSTRAINT "ExpenseCategory_userId_fkey";
DROP INDEX "ExpenseCategory_userId_name_key";
ALTER TABLE "ExpenseCategory" DROP COLUMN "userId";
ALTER TABLE "ExpenseCategory" ALTER COLUMN "householdId" SET NOT NULL;

ALTER TABLE "Account" ADD COLUMN "householdId" TEXT;
UPDATE "Account" a
SET "householdId" = hm."householdId"
FROM "HouseholdMember" hm
WHERE a."userId" = hm."userId";
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";
ALTER TABLE "Account" DROP COLUMN "userId";
ALTER TABLE "Account" ALTER COLUMN "householdId" SET NOT NULL;

CREATE TABLE "CategoryBudget" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "expenseCategoryId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "limitAmount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringPayment" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "familyMemberId" TEXT NOT NULL,
    "expenseCategoryId" TEXT,
    "incomeTypeId" TEXT,
    "accountId" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "dayOfMonth" INTEGER,
    "dayOfWeek" INTEGER,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecurringPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HouseholdMember_userId_key" ON "HouseholdMember"("userId");
CREATE INDEX "HouseholdMember_householdId_idx" ON "HouseholdMember"("householdId");
CREATE UNIQUE INDEX "HouseholdInvite_token_key" ON "HouseholdInvite"("token");
CREATE INDEX "HouseholdInvite_householdId_idx" ON "HouseholdInvite"("householdId");
CREATE INDEX "HouseholdInvite_email_idx" ON "HouseholdInvite"("email");
CREATE INDEX "FamilyMember_householdId_idx" ON "FamilyMember"("householdId");
CREATE UNIQUE INDEX "IncomeType_householdId_name_key" ON "IncomeType"("householdId", "name");
CREATE INDEX "IncomeType_householdId_idx" ON "IncomeType"("householdId");
CREATE UNIQUE INDEX "ExpenseCategory_householdId_name_key" ON "ExpenseCategory"("householdId", "name");
CREATE INDEX "ExpenseCategory_householdId_idx" ON "ExpenseCategory"("householdId");
CREATE INDEX "Account_householdId_idx" ON "Account"("householdId");
CREATE UNIQUE INDEX "CategoryBudget_householdId_expenseCategoryId_month_key"
  ON "CategoryBudget"("householdId", "expenseCategoryId", "month");
CREATE INDEX "CategoryBudget_householdId_month_idx" ON "CategoryBudget"("householdId", "month");
CREATE INDEX "RecurringPayment_householdId_idx" ON "RecurringPayment"("householdId");
CREATE INDEX "RecurringPayment_nextRunAt_isActive_idx" ON "RecurringPayment"("nextRunAt", "isActive");

ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncomeType" ADD CONSTRAINT "IncomeType_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_expenseCategoryId_fkey"
  FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringPayment" ADD CONSTRAINT "RecurringPayment_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
