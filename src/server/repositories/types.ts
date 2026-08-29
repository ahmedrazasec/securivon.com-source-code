import "server-only";

/**
 * Repository interfaces for every domain Stage 2's Admin foundation manages.
 *
 * Deliberately Prisma-free (plain TypeScript shapes only) so:
 *   1. Business logic that depends on these interfaces (authorization,
 *      pricing-status rules, archive/soft-delete behavior) can be fully
 *      unit-tested against in-memory fakes (see repositories/inMemory.ts,
 *      test-only) without a live database.
 *   2. The real Prisma-backed implementations (repositories/prisma/*.ts)
 *      stay isolated and swappable — same pattern established in Stage 1
 *      for AdminUserRepository, now extended to every new domain.
 *
 * Field shapes mirror prisma/schema.prisma; internal-only fields
 * (supplierCost, Supplier.notes, Product.sourceUrl) are still present here
 * because these are ADMIN-facing interfaces — the public/customer-facing
 * boundary is enforced separately by src/server/serializers/*, not by
 * omitting fields at this layer.
 */

export interface ProductRecord {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  brandId: string;
  categoryId: string;
  productType: string;
  shortDescription: string | null;
  longDescription: string | null;
  images: unknown;
  specifications: unknown;
  useCases: string[];
  warrantyId: string | null;
  supplierId: string | null;
  supplierCost: number | null;
  customerPriceType: string;
  customerPriceValue: number | null;
  customerPriceValueMax: number | null;
  installationPriceType: string;
  installationPriceValue: number | null;
  installationPriceValueMax: number | null;
  pricingStatus: "VERIFIED" | "NEEDS_REVIEW" | "STALE";
  priceEffectiveDate: string | null;
  priceReviewDueDate: string | null;
  availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ORDER_REQUIRED" | "DISCONTINUED" | "UNKNOWN";
  verificationDate: string | null;
  sourceUrl: string | null;
  configuratorTags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export type ProductCreateInput = Omit<ProductRecord, "id" | "createdAt" | "updatedAt">;
export type ProductUpdateInput = Partial<ProductCreateInput>;

export interface ProductRepository {
  findById(id: string): Promise<ProductRecord | null>;
  findBySlug(slug: string): Promise<ProductRecord | null>;
  list(filter?: { status?: ProductRecord["status"]; categoryId?: string }): Promise<ProductRecord[]>;
  create(input: ProductCreateInput): Promise<ProductRecord>;
  update(id: string, input: ProductUpdateInput): Promise<ProductRecord>;
  archive(id: string): Promise<ProductRecord>;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  parentCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}
export type CategoryCreateInput = Omit<CategoryRecord, "id" | "createdAt" | "updatedAt">;
export type CategoryUpdateInput = Partial<CategoryCreateInput>;

export interface CategoryRepository {
  findById(id: string): Promise<CategoryRecord | null>;
  list(): Promise<CategoryRecord[]>;
  create(input: CategoryCreateInput): Promise<CategoryRecord>;
  update(id: string, input: CategoryUpdateInput): Promise<CategoryRecord>;
  deactivate(id: string): Promise<CategoryRecord>;
}

export interface BrandRecord {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  countryOfOrigin: string | null;
  description: string | null;
  websiteUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export type BrandCreateInput = Omit<BrandRecord, "id" | "createdAt" | "updatedAt">;
export type BrandUpdateInput = Partial<BrandCreateInput>;

export interface BrandRepository {
  findById(id: string): Promise<BrandRecord | null>;
  list(): Promise<BrandRecord[]>;
  create(input: BrandCreateInput): Promise<BrandRecord>;
  update(id: string, input: BrandUpdateInput): Promise<BrandRecord>;
  deactivate(id: string): Promise<BrandRecord>;
}

export interface SupplierRecord {
  id: string;
  name: string;
  contactInfo: unknown;
  tier: "PRIMARY" | "STRONG" | "DISCOVERY";
  // INTERNAL ONLY — present here because this is an Admin-facing interface;
  // never passed through src/server/serializers/* to any public response.
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
export type SupplierCreateInput = Omit<SupplierRecord, "id" | "createdAt" | "updatedAt">;
export type SupplierUpdateInput = Partial<SupplierCreateInput>;

export interface SupplierRepository {
  findById(id: string): Promise<SupplierRecord | null>;
  list(): Promise<SupplierRecord[]>;
  create(input: SupplierCreateInput): Promise<SupplierRecord>;
  update(id: string, input: SupplierUpdateInput): Promise<SupplierRecord>;
  archive(id: string): Promise<SupplierRecord>;
}

export interface WarrantyRecord {
  id: string;
  name: string;
  durationMonths: number;
  provider: "MANUFACTURER" | "SECURIVON" | "DISTRIBUTOR";
  warrantyType: string | null;
  conditionsText: string | null;
  exclusionsText: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export type WarrantyCreateInput = Omit<WarrantyRecord, "id" | "createdAt" | "updatedAt">;
export type WarrantyUpdateInput = Partial<WarrantyCreateInput>;

export interface WarrantyRepository {
  findById(id: string): Promise<WarrantyRecord | null>;
  list(): Promise<WarrantyRecord[]>;
  create(input: WarrantyCreateInput): Promise<WarrantyRecord>;
  update(id: string, input: WarrantyUpdateInput): Promise<WarrantyRecord>;
  deactivate(id: string): Promise<WarrantyRecord>;
}

export interface PackageItemRecord {
  id: string;
  packageId: string;
  productId: string;
  quantity: number;
  requirement: "REQUIRED" | "OPTIONAL";
  inclusionStatus: "INCLUDED" | "EXCLUDED" | "OPTIONAL_ADDON";
  priceOverride: number | null;
  customerFacingDescription: string | null;
  internalNotes: string | null;
  displayOrder: number;
}

export interface PackageRecord {
  id: string;
  slug: string;
  name: string;
  targetCustomerDescription: string | null;
  category: string;
  cameraCount: number | null;
  cameraTypeSummary: string | null;
  recorderProductId: string | null;
  storageSummary: string | null;
  networkingSummary: string | null;
  cablingAssumptionText: string | null;
  powerSummary: string | null;
  installationSummary: string | null;
  warrantyId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  priceType: string;
  priceValue: number | null;
  priceValueMax: number | null;
  /** ISO date string, or null if this package's price has never been verified — see src/server/pricing/pricingStatus.ts-style honesty rule applied in src/server/serializers/package.ts. */
  priceVerificationDate: string | null;
  /**
   * Admin-authored initial answers for the "Configure This Package" CTA
   * (see src/server/publicRoutes/packageCatalogue.ts /
   * src/server/validation/configuratorPrefill.ts for the schema this is
   * validated against before ever being used). Loosely typed here — same
   * reasoning as Product.images/specifications — so this file has zero
   * dependency on the generated Prisma client.
   */
  configuratorPrefill: unknown;
  createdAt: string;
  updatedAt: string;
  items: PackageItemRecord[];
}

export type PackageCreateInput = Omit<PackageRecord, "id" | "createdAt" | "updatedAt" | "items">;
export type PackageUpdateInput = Partial<PackageCreateInput>;
export type PackageItemInput = Omit<PackageItemRecord, "id" | "packageId">;

export interface PackageRepository {
  findById(id: string): Promise<PackageRecord | null>;
  findBySlug(slug: string): Promise<PackageRecord | null>;
  list(): Promise<PackageRecord[]>;
  create(input: PackageCreateInput): Promise<PackageRecord>;
  update(id: string, input: PackageUpdateInput): Promise<PackageRecord>;
  archive(id: string): Promise<PackageRecord>;
  addItem(packageId: string, item: PackageItemInput): Promise<PackageRecord>;
  updateItem(packageId: string, itemId: string, item: Partial<PackageItemInput>): Promise<PackageRecord>;
  removeItem(packageId: string, itemId: string): Promise<PackageRecord>;
  reorderItems(packageId: string, orderedItemIds: string[]): Promise<PackageRecord>;
}

export interface InstallationRateRecord {
  id: string;
  serviceType: "CCTV" | "ACCESS_CONTROL" | "INTERCOM" | "NETWORKING";
  baseRatePerUnit: number;
  floorModifier: number;
  heightAccessModifier: number;
  conduitTrunkingModifier: number;
  existingVsNewCablingModifier: number;
  configurationFee: number;
  remoteViewSetupFee: number;
  minimumCharge: number;
  verificationDate: string | null;
}
export type InstallationRateUpdateInput = Partial<Omit<InstallationRateRecord, "id" | "serviceType">>;

export interface InstallationRateRepository {
  findByServiceType(serviceType: InstallationRateRecord["serviceType"]): Promise<InstallationRateRecord | null>;
  list(): Promise<InstallationRateRecord[]>;
  upsert(serviceType: InstallationRateRecord["serviceType"], input: InstallationRateUpdateInput): Promise<InstallationRateRecord>;
}

/**
 * PricingTier — reused as both "camera coverage tier" and "recorder tier"
 * rows via a serviceType naming convention (see
 * src/server/pricing/rateSetLoader.ts): "CCTV_COVERAGE_<tierId>" (e.g.
 * "CCTV_COVERAGE_STANDARD") for coverage tiers, "CCTV_RECORDER" for
 * recorder tiers (maxQuantity = camera capacity). Genuinely multi-row,
 * unlike InstallationRate/CablingRate/RoundingRule — Admin creates one row
 * per tier.
 */
export interface PricingTierRecord {
  id: string;
  serviceType: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  verificationDate: string | null;
}
export type PricingTierCreateInput = Omit<PricingTierRecord, "id">;
export type PricingTierUpdateInput = Partial<PricingTierCreateInput>;

export interface PricingTierRepository {
  list(): Promise<PricingTierRecord[]>;
  create(input: PricingTierCreateInput): Promise<PricingTierRecord>;
  update(id: string, input: PricingTierUpdateInput): Promise<PricingTierRecord>;
  delete(id: string): Promise<void>;
}

/**
 * CablingRate — treated as a single "current rate" settings row (Admin
 * edits "the" cabling rate), matching how the rate-set loader consumes it
 * (picks the single most-recently-updated row, not discriminated by
 * cableType). A genuine multi-cable-type catalogue is a legitimate future
 * enhancement, not built here to avoid inventing an ambiguous UX the
 * loader doesn't actually use yet.
 */
export interface CablingRateRecord {
  id: string;
  cableType: string;
  ratePerMeter: number;
  includedAllowancePerCamera: number;
  verificationDate: string | null;
}
export type CablingRateUpdateInput = Partial<Omit<CablingRateRecord, "id">>;

export interface CablingRateRepository {
  getCurrent(): Promise<CablingRateRecord | null>;
  upsert(input: CablingRateUpdateInput): Promise<CablingRateRecord>;
}

/** RoundingRule — single global settings row, same singleton pattern as CablingRate. */
export interface RoundingRuleRecord {
  id: string;
  granularity: number;
  direction: "NEAREST" | "UP" | "DOWN";
}
export type RoundingRuleUpdateInput = Partial<Omit<RoundingRuleRecord, "id">>;

export interface RoundingRuleRepository {
  getCurrent(): Promise<RoundingRuleRecord | null>;
  upsert(input: RoundingRuleUpdateInput): Promise<RoundingRuleRecord>;
}

/**
 * Discount — genuinely multi-row (Admin can define several discounts),
 * same CRUD shape as PricingTier. Only the effect on the Configurator's
 * estimate is currently narrow: src/server/pricing/rateSetLoader.ts only
 * ever loads the single most-recently-updated row where
 * `sitewide: true AND active: true` — package/category-scoped discounts
 * and multiple simultaneous discounts are stored and manageable here, but
 * not yet combined/applied by the engine. That's an existing, intentional
 * engine limitation (see rateSetLoader.ts) — this repository layer doesn't
 * change it, only makes every schema field manageable from Admin.
 */
export interface DiscountRecord {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  appliesToPackageId: string | null;
  appliesToCategoryId: string | null;
  sitewide: boolean;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
}
export type DiscountCreateInput = Omit<DiscountRecord, "id">;
export type DiscountUpdateInput = Partial<DiscountCreateInput>;

export interface DiscountRepository {
  list(): Promise<DiscountRecord[]>;
  create(input: DiscountCreateInput): Promise<DiscountRecord>;
  update(id: string, input: DiscountUpdateInput): Promise<DiscountRecord>;
  delete(id: string): Promise<void>;
}

/**
 * TaxRule — genuinely multi-row (e.g. separate HARDWARE vs INSTALLATION vs
 * ALL rules could coexist), same CRUD shape as PricingTier/Discount. As
 * with Discount, the engine currently only loads a single active row
 * (rateSetLoader.ts: `taxRule.findFirst({ where: { active: true } })`) —
 * this layer exposes every schema field without changing that behavior.
 */
export interface TaxRuleRecord {
  id: string;
  name: string;
  ratePercentage: number;
  appliesTo: "HARDWARE" | "INSTALLATION" | "ALL";
  inclusiveOrExclusive: "INCLUSIVE" | "EXCLUSIVE" | "UNSTATED";
  active: boolean;
}
export type TaxRuleCreateInput = Omit<TaxRuleRecord, "id">;
export type TaxRuleUpdateInput = Partial<TaxRuleCreateInput>;

export interface TaxRuleRepository {
  list(): Promise<TaxRuleRecord[]>;
  create(input: TaxRuleCreateInput): Promise<TaxRuleRecord>;
  update(id: string, input: TaxRuleUpdateInput): Promise<TaxRuleRecord>;
  delete(id: string): Promise<void>;
}

/**
 * MinimumChargeRule — one row per serviceType (String, @unique in the
 * schema), same singleton-per-key upsert pattern as InstallationRate.
 * Only "CCTV" is currently read by the rate-set loader
 * (`minimumChargeRule.findUnique({ where: { serviceType: "CCTV" } })`);
 * the Admin route restricts serviceType to the same fixed set
 * InstallationRate uses, for the same reason — so Admin can't create an
 * unusable row via a typo'd serviceType that nothing ever reads.
 */
export interface MinimumChargeRuleRecord {
  id: string;
  serviceType: string;
  minimumChargeAmount: number;
}
export type MinimumChargeRuleUpdateInput = Partial<Pick<MinimumChargeRuleRecord, "minimumChargeAmount">>;

export interface MinimumChargeRuleRepository {
  list(): Promise<MinimumChargeRuleRecord[]>;
  findByServiceType(serviceType: string): Promise<MinimumChargeRuleRecord | null>;
  upsert(serviceType: string, input: MinimumChargeRuleUpdateInput): Promise<MinimumChargeRuleRecord>;
}

export interface PricingAuditLogRecord {
  id: string;
  adminUserId: string;
  action: "CREATE" | "UPDATE" | "ARCHIVE";
  entityType: string;
  entityId: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}
export type PricingAuditLogCreateInput = Omit<PricingAuditLogRecord, "id" | "changedAt">;

export interface PricingAuditLogRepository {
  create(input: PricingAuditLogCreateInput): Promise<PricingAuditLogRecord>;
  listForEntity(entityType: string, entityId: string): Promise<PricingAuditLogRecord[]>;
  listRecent(limit?: number): Promise<PricingAuditLogRecord[]>;
}

// ----------------------------------------------------------------------------
// Leads / Quotes / Site Surveys — READ-ONLY admin visibility.
//
// These interfaces intentionally expose no create/update/deactivate methods.
// The public submission path (src/server/publicRoutes/leads.ts /
// src/app/api/leads/route.ts) is the only writer for Customer/Lead/
// SiteSurveyRequest/Quote right now — Admin's job here is visibility, not
// mutation, per the explicit "read-only dashboard first" instruction. If
// status-editing (e.g. Lead.status, SiteSurveyRequest.status) is added
// later, it belongs in a dedicated write method added deliberately, not
// bolted onto list()/findById().
// ----------------------------------------------------------------------------

/** Minimal Customer shape as embedded in Lead-related admin views. PII — Admin-only, never sent to public serializers. */
export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  addressArea: string | null;
  source: "CONFIGURATOR" | "REQUEST_QUOTE_FORM" | "WHATSAPP_DIRECT" | "PHONE";
  createdAt: string;
}

export interface LeadListRecord {
  id: string;
  journeySource: "CONFIGURATOR" | "BROWSE_PACKAGE" | "BROWSE_SERVICE" | "DIRECT_CONTACT";
  status: "NEW" | "CONTACTED" | "SITE_SURVEY_SCHEDULED" | "QUOTED" | "WON" | "LOST";
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CustomerSummary;
  quoteCount: number;
  siteSurveyRequestCount: number;
}

export interface LeadDetailRecord extends LeadListRecord {
  quotes: QuoteListRecord[];
  siteSurveyRequests: SiteSurveyRequestListRecord[];
}

export interface LeadRepository {
  list(filter?: { status?: LeadListRecord["status"] }): Promise<LeadListRecord[]>;
  findById(id: string): Promise<LeadDetailRecord | null>;
}

export interface QuoteItemRecord {
  id: string;
  itemType: "PRODUCT" | "PACKAGE" | "CUSTOM_LINE";
  productId: string | null;
  packageId: string | null;
  description: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotal: number;
}

export interface QuoteListRecord {
  id: string;
  leadId: string;
  packageId: string | null;
  type: "CONFIGURATOR_ESTIMATE" | "PACKAGE_BASED" | "MANUAL_CUSTOM";
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED";
  totalEstimatedLow: number | null;
  totalEstimatedHigh: number | null;
  isEstimateOnly: boolean;
  siteSurveyRequired: boolean;
  revisedFromQuoteId: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CustomerSummary;
}

export interface QuoteDetailRecord extends QuoteListRecord {
  // Full snapshots — Admin-only, exactly what was frozen at submission time.
  // Never recalculated, never sent to public serializers.
  configurationSnapshot: unknown;
  pricingRulesSnapshot: unknown;
  items: QuoteItemRecord[];
}

export interface QuoteRepository {
  list(filter?: { status?: QuoteListRecord["status"] }): Promise<QuoteListRecord[]>;
  findById(id: string): Promise<QuoteDetailRecord | null>;
}

export interface SiteSurveyRequestListRecord {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  propertyType: string;
  location: string;
  preferredDateTime: string | null;
  configurationReference: string | null;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface SiteSurveyRequestDetailRecord extends SiteSurveyRequestListRecord {
  notes: string | null;
  customer: CustomerSummary;
}

export interface SiteSurveyRequestRepository {
  list(filter?: { status?: SiteSurveyRequestListRecord["status"] }): Promise<SiteSurveyRequestListRecord[]>;
  findById(id: string): Promise<SiteSurveyRequestDetailRecord | null>;
}
