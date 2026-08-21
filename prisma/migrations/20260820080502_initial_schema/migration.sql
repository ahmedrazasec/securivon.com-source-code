-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'STARTING_FROM', 'RANGE', 'ESTIMATED', 'QUOTE_ONLY');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ORDER_REQUIRED', 'DISCONTINUED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PricingStatus" AS ENUM ('VERIFIED', 'NEEDS_REVIEW', 'STALE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SupplierTier" AS ENUM ('PRIMARY', 'STRONG', 'DISCOVERY');

-- CreateEnum
CREATE TYPE "WarrantyProvider" AS ENUM ('MANUFACTURER', 'SECURIVON', 'DISTRIBUTOR');

-- CreateEnum
CREATE TYPE "PackageCategory" AS ENUM ('HOME_STARTER', 'HOME_COMPLETE', 'SHOP_RETAIL', 'OFFICE', 'RESTAURANT_CAFE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PackageItemRequirement" AS ENUM ('REQUIRED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "PackageItemInclusion" AS ENUM ('INCLUDED', 'EXCLUDED', 'OPTIONAL_ADDON');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "TaxAppliesTo" AS ENUM ('HARDWARE', 'INSTALLATION', 'ALL');

-- CreateEnum
CREATE TYPE "TaxInclusivity" AS ENUM ('INCLUSIVE', 'EXCLUSIVE', 'UNSTATED');

-- CreateEnum
CREATE TYPE "RoundingDirection" AS ENUM ('NEAREST', 'UP', 'DOWN');

-- CreateEnum
CREATE TYPE "InstallationServiceType" AS ENUM ('CCTV', 'ACCESS_CONTROL', 'INTERCOM', 'NETWORKING');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('CONFIGURATOR', 'REQUEST_QUOTE_FORM', 'WHATSAPP_DIRECT', 'PHONE');

-- CreateEnum
CREATE TYPE "LeadJourneySource" AS ENUM ('CONFIGURATOR', 'BROWSE_PACKAGE', 'BROWSE_SERVICE', 'DIRECT_CONTACT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SITE_SURVEY_SCHEDULED', 'QUOTED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "SiteSurveyStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuoteType" AS ENUM ('CONFIGURATOR_ESTIMATE', 'PACKAGE_BASED', 'MANUAL_CUSTOM');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteItemType" AS ENUM ('PRODUCT', 'PACKAGE', 'CUSTOM_LINE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'CONTENT_EDITOR', 'PRICING_MANAGER', 'SALES_OPERATIONS');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "countryOfOrigin" TEXT,
    "description" TEXT,
    "websiteUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "parentCategoryId" TEXT,
    "specificationTemplate" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" JSONB,
    "tier" "SupplierTier" NOT NULL DEFAULT 'DISCOVERY',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "provider" "WarrantyProvider" NOT NULL DEFAULT 'MANUFACTURER',
    "warrantyType" TEXT,
    "conditionsText" TEXT,
    "exclusionsText" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "images" JSONB,
    "specifications" JSONB,
    "useCases" TEXT[],
    "warrantyId" TEXT,
    "supplierId" TEXT,
    "supplierCost" DECIMAL(12,2),
    "customerPriceType" "PriceType" NOT NULL DEFAULT 'QUOTE_ONLY',
    "customerPriceValue" DECIMAL(12,2),
    "customerPriceValueMax" DECIMAL(12,2),
    "installationPriceType" "PriceType" NOT NULL DEFAULT 'QUOTE_ONLY',
    "installationPriceValue" DECIMAL(12,2),
    "installationPriceValueMax" DECIMAL(12,2),
    "pricingStatus" "PricingStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "priceEffectiveDate" TIMESTAMP(3),
    "priceReviewDueDate" TIMESTAMP(3),
    "availability" "Availability" NOT NULL DEFAULT 'UNKNOWN',
    "verificationDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "configuratorTags" TEXT[],
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetCustomerDescription" TEXT,
    "category" "PackageCategory" NOT NULL,
    "cameraCount" INTEGER,
    "cameraTypeSummary" TEXT,
    "recorderProductId" TEXT,
    "storageSummary" TEXT,
    "networkingSummary" TEXT,
    "cablingAssumptionText" TEXT,
    "powerSummary" TEXT,
    "installationSummary" TEXT,
    "warrantyId" TEXT,
    "priceType" "PriceType" NOT NULL DEFAULT 'QUOTE_ONLY',
    "priceValue" DECIMAL(12,2),
    "priceValueMax" DECIMAL(12,2),
    "priceVerificationDate" TIMESTAMP(3),
    "configuratorPrefill" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requirement" "PackageItemRequirement" NOT NULL DEFAULT 'REQUIRED',
    "inclusionStatus" "PackageItemInclusion" NOT NULL DEFAULT 'INCLUDED',
    "priceOverride" DECIMAL(12,2),
    "customerFacingDescription" TEXT,
    "internalNotes" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "serviceType" TEXT,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "verificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CablingRate" (
    "id" TEXT NOT NULL,
    "cableType" TEXT NOT NULL,
    "ratePerMeter" DECIMAL(12,2) NOT NULL,
    "includedAllowancePerCamera" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "verificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CablingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationRate" (
    "id" TEXT NOT NULL,
    "serviceType" "InstallationServiceType" NOT NULL,
    "baseRatePerUnit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "floorModifier" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "heightAccessModifier" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conduitTrunkingModifier" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "existingVsNewCablingModifier" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "configurationFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remoteViewSetupFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minimumCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "verificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinimumChargeRule" (
    "id" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "minimumChargeAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinimumChargeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "appliesToPackageId" TEXT,
    "appliesToCategoryId" TEXT,
    "sitewide" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ratePercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "appliesTo" "TaxAppliesTo" NOT NULL DEFAULT 'ALL',
    "inclusiveOrExclusive" "TaxInclusivity" NOT NULL DEFAULT 'UNSTATED',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundingRule" (
    "id" TEXT NOT NULL,
    "granularity" DECIMAL(12,2) NOT NULL DEFAULT 500,
    "direction" "RoundingDirection" NOT NULL DEFAULT 'NEAREST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "addressArea" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'REQUEST_QUOTE_FORM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "journeySource" "LeadJourneySource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSurveyRequest" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "preferredDateTime" TEXT,
    "notes" TEXT,
    "configurationReference" TEXT,
    "status" "SiteSurveyStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSurveyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "packageId" TEXT,
    "type" "QuoteType" NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "totalEstimatedLow" DECIMAL(12,2),
    "totalEstimatedHigh" DECIMAL(12,2),
    "isEstimateOnly" BOOLEAN NOT NULL DEFAULT true,
    "siteSurveyRequired" BOOLEAN NOT NULL DEFAULT false,
    "configurationSnapshot" JSONB NOT NULL,
    "pricingRulesSnapshot" JSONB NOT NULL,
    "revisedFromQuoteId" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "itemType" "QuoteItemType" NOT NULL,
    "productId" TEXT,
    "packageId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguratorSession" (
    "id" TEXT NOT NULL,
    "propertyType" TEXT,
    "answers" JSONB NOT NULL,
    "computedResult" JSONB,
    "isConsultative" BOOLEAN NOT NULL DEFAULT false,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguratorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quoteOnly" BOOLEAN NOT NULL DEFAULT false,
    "problemText" TEXT,
    "solutionText" TEXT,
    "suitableCustomersText" TEXT,
    "featuresText" TEXT,
    "processText" TEXT,
    "equipmentText" TEXT,
    "warrantyText" TEXT,
    "faq" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldChanged" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductRelated" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductRelated_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductCompatible" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductCompatible_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_slug_idx" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_active_idx" ON "Brand"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentCategoryId_idx" ON "Category"("parentCategoryId");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "Supplier_tier_idx" ON "Supplier"("tier");

-- CreateIndex
CREATE INDEX "Warranty_active_idx" ON "Warranty"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_availability_idx" ON "Product"("availability");

-- CreateIndex
CREATE INDEX "Product_pricingStatus_idx" ON "Product"("pricingStatus");

-- CreateIndex
CREATE INDEX "Product_verificationDate_idx" ON "Product"("verificationDate");

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");

-- CreateIndex
CREATE INDEX "Package_slug_idx" ON "Package"("slug");

-- CreateIndex
CREATE INDEX "Package_category_idx" ON "Package"("category");

-- CreateIndex
CREATE INDEX "Package_status_idx" ON "Package"("status");

-- CreateIndex
CREATE INDEX "PackageItem_packageId_idx" ON "PackageItem"("packageId");

-- CreateIndex
CREATE INDEX "PackageItem_productId_idx" ON "PackageItem"("productId");

-- CreateIndex
CREATE INDEX "PricingTier_productId_idx" ON "PricingTier"("productId");

-- CreateIndex
CREATE INDEX "PricingTier_serviceType_idx" ON "PricingTier"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationRate_serviceType_key" ON "InstallationRate"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "MinimumChargeRule_serviceType_key" ON "MinimumChargeRule"("serviceType");

-- CreateIndex
CREATE INDEX "Discount_active_idx" ON "Discount"("active");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Lead_customerId_idx" ON "Lead"("customerId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_journeySource_idx" ON "Lead"("journeySource");

-- CreateIndex
CREATE INDEX "SiteSurveyRequest_leadId_idx" ON "SiteSurveyRequest"("leadId");

-- CreateIndex
CREATE INDEX "SiteSurveyRequest_status_idx" ON "SiteSurveyRequest"("status");

-- CreateIndex
CREATE INDEX "Quote_leadId_idx" ON "Quote"("leadId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_revisedFromQuoteId_idx" ON "Quote"("revisedFromQuoteId");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE INDEX "ConfiguratorSession_leadId_idx" ON "ConfiguratorSession"("leadId");

-- CreateIndex
CREATE INDEX "ConfiguratorSession_createdAt_idx" ON "ConfiguratorSession"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_slug_idx" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_slug_key" ON "ServiceArea"("slug");

-- CreateIndex
CREATE INDEX "ServiceArea_slug_idx" ON "ServiceArea"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE INDEX "Guide_slug_idx" ON "Guide"("slug");

-- CreateIndex
CREATE INDEX "Guide_status_idx" ON "Guide"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "PricingAuditLog_entityType_entityId_idx" ON "PricingAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PricingAuditLog_adminUserId_idx" ON "PricingAuditLog"("adminUserId");

-- CreateIndex
CREATE INDEX "PricingAuditLog_changedAt_idx" ON "PricingAuditLog"("changedAt");

-- CreateIndex
CREATE INDEX "_ProductRelated_B_index" ON "_ProductRelated"("B");

-- CreateIndex
CREATE INDEX "_ProductCompatible_B_index" ON "_ProductCompatible"("B");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_appliesToPackageId_fkey" FOREIGN KEY ("appliesToPackageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_appliesToCategoryId_fkey" FOREIGN KEY ("appliesToCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSurveyRequest" ADD CONSTRAINT "SiteSurveyRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_revisedFromQuoteId_fkey" FOREIGN KEY ("revisedFromQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguratorSession" ADD CONSTRAINT "ConfiguratorSession_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingAuditLog" ADD CONSTRAINT "PricingAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductRelated" ADD CONSTRAINT "_ProductRelated_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductRelated" ADD CONSTRAINT "_ProductRelated_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCompatible" ADD CONSTRAINT "_ProductCompatible_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCompatible" ADD CONSTRAINT "_ProductCompatible_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
