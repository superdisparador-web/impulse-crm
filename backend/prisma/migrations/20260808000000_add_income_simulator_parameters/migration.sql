-- CreateEnum
CREATE TYPE "IncomeParameterTableStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "income_parameter_tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,
    "status" "IncomeParameterTableStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_parameter_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_parameter_rows" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "income" DECIMAL(18,2) NOT NULL,
    "firstInstallment" DECIMAL(18,2) NOT NULL,
    "rateWithoutReducer" DECIMAL(10,6) NOT NULL,
    "financingWithoutReducer" DECIMAL(18,2) NOT NULL,
    "rateWithReducer" DECIMAL(10,6) NOT NULL,
    "financingWithReducer" DECIMAL(18,2) NOT NULL,
    "subsidyWithDependent" DECIMAL(18,2) NOT NULL,
    "subsidyWithoutDependent" DECIMAL(18,2) NOT NULL,
    "maxPropertyValue" DECIMAL(18,2) NOT NULL,
    "incomeBand" TEXT NOT NULL,
    "housingCategory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_parameter_rows_pkey" PRIMARY KEY ("id")
);

-- Enforce that only one parameter table can be active at a time.
CREATE UNIQUE INDEX "income_parameter_tables_single_active_idx"
ON "income_parameter_tables" ("status")
WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "income_parameter_rows_tableId_idx" ON "income_parameter_rows"("tableId");

-- CreateIndex
CREATE INDEX "income_parameter_rows_income_idx" ON "income_parameter_rows"("income");

-- CreateIndex
CREATE INDEX "income_parameter_rows_tableId_income_idx" ON "income_parameter_rows"("tableId", "income");

-- AddForeignKey
ALTER TABLE "income_parameter_rows"
ADD CONSTRAINT "income_parameter_rows_tableId_fkey"
FOREIGN KEY ("tableId") REFERENCES "income_parameter_tables"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
