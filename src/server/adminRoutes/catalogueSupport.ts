import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";

/**
 * Category / Brand / Supplier / Warranty / Service Admin route handlers.
 *
 * Mounted at src/app/api/admin/{categories,brands,suppliers,warranties,services}/
 * route.ts and .../[id]/route.ts — those files re-export/adapt the
 * functions below rather than duplicating logic. Edit request handling
 * here; edit routing/param-adaptation there. Grouped in one file since
 * each is a straightforward CRUD set over a simple entity, unlike
 * Products/Packages which have real business logic.
 */

// --- Categories ---

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  parentCategoryId: z.string().nullable().optional(),
});

export async function listCategories(request: NextRequest) {
  return withAdminAuth(request, "VIEW_ADMIN", async () => {
    return NextResponse.json({ categories: await container.categories.list() });
  });
}

export async function createCategory(request: NextRequest) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = categorySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const category = await container.categories.create({
      ...parsed.data,
      description: parsed.data.description ?? null,
      seoTitle: parsed.data.seoTitle ?? null,
      seoDescription: parsed.data.seoDescription ?? null,
      parentCategoryId: parsed.data.parentCategoryId ?? null,
    });
    return NextResponse.json({ category }, { status: 201 });
  });
}

export async function updateCategory(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = categorySchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const category = await container.categories.update(id, parsed.data);
    return NextResponse.json({ category });
  });
}

export async function deactivateCategory(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    return NextResponse.json({ category: await container.categories.deactivate(id) });
  });
}

// --- Brands ---

const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().nullable().optional(),
  countryOfOrigin: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  // Only ever a verified, real manufacturer URL — validated as a well-formed
  // URL here; verifying it's *real* is an Admin-operator responsibility,
  // not something software can check, per Phase 4 Corrections §5/§7.
  websiteUrl: z.string().url().nullable().optional(),
  active: z.boolean().default(true),
});

export async function listBrands(request: NextRequest) {
  return withAdminAuth(request, "VIEW_ADMIN", async () => {
    return NextResponse.json({ brands: await container.brands.list() });
  });
}

export async function createBrand(request: NextRequest) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = brandSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const brand = await container.brands.create({
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? null,
      countryOfOrigin: parsed.data.countryOfOrigin ?? null,
      description: parsed.data.description ?? null,
      websiteUrl: parsed.data.websiteUrl ?? null,
    });
    return NextResponse.json({ brand }, { status: 201 });
  });
}

export async function updateBrand(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = brandSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    return NextResponse.json({ brand: await container.brands.update(id, parsed.data) });
  });
}

export async function deactivateBrand(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    return NextResponse.json({ brand: await container.brands.deactivate(id) });
  });
}

// --- Suppliers (internal-only data — Admin access only, never public) ---

const supplierSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.unknown().nullable().optional(),
  tier: z.enum(["PRIMARY", "STRONG", "DISCOVERY"]).default("DISCOVERY"),
  notes: z.string().nullable().optional(),
});

export async function listSuppliers(request: NextRequest) {
  // "EDIT_PRICING"-equivalent sensitivity — suppliers are cost-adjacent
  // data, so this uses the same authorization action as pricing edits
  // rather than the general VIEW_ADMIN, even for read access.
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ suppliers: await container.suppliers.list() });
  });
}

export async function createSupplier(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    const parsed = supplierSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const supplier = await container.suppliers.create({
      ...parsed.data,
      contactInfo: parsed.data.contactInfo ?? null,
      notes: parsed.data.notes ?? null,
    });
    return NextResponse.json({ supplier }, { status: 201 });
  });
}

export async function updateSupplier(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    const parsed = supplierSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    return NextResponse.json({ supplier: await container.suppliers.update(id, parsed.data) });
  });
}

export async function archiveSupplier(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ supplier: await container.suppliers.archive(id) });
  });
}

// --- Warranties ---

const warrantySchema = z.object({
  name: z.string().min(1),
  durationMonths: z.number().int().min(0),
  provider: z.enum(["MANUFACTURER", "SECURIVON", "DISTRIBUTOR"]),
  warrantyType: z.string().nullable().optional(),
  conditionsText: z.string().nullable().optional(),
  exclusionsText: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export async function listWarranties(request: NextRequest) {
  return withAdminAuth(request, "VIEW_ADMIN", async () => {
    return NextResponse.json({ warranties: await container.warranties.list() });
  });
}

export async function createWarranty(request: NextRequest) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = warrantySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const warranty = await container.warranties.create({
      ...parsed.data,
      warrantyType: parsed.data.warrantyType ?? null,
      conditionsText: parsed.data.conditionsText ?? null,
      exclusionsText: parsed.data.exclusionsText ?? null,
    });
    return NextResponse.json({ warranty }, { status: 201 });
  });
}

export async function updateWarranty(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = warrantySchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    return NextResponse.json({ warranty: await container.warranties.update(id, parsed.data) });
  });
}

export async function deactivateWarranty(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    return NextResponse.json({ warranty: await container.warranties.deactivate(id) });
  });
}

// --- Services ---
//
// Minimal admin CRUD — no rich-text/FAQ authoring UI in this batch (faq
// stays null until a future batch needs it). "Publish/unpublish" is just
// `status`; archive is the same soft-delete convention Package uses
// (status -> "ARCHIVED"), not a DELETE.

const serviceSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  shortDescription: z.string().nullable().optional(),
  quoteOnly: z.boolean().default(false),
  problemText: z.string().nullable().optional(),
  solutionText: z.string().nullable().optional(),
  // One item per line — matches serviceCatalogue.ts's toLines() split on the public side.
  suitableCustomersText: z.string().nullable().optional(),
  featuresText: z.string().nullable().optional(),
  considerationsText: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function listServices(request: NextRequest) {
  return withAdminAuth(request, "VIEW_ADMIN", async () => {
    return NextResponse.json({ services: await container.services.list() });
  });
}

export async function createService(request: NextRequest) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = serviceSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const service = await container.services.create({
      ...parsed.data,
      shortDescription: parsed.data.shortDescription ?? null,
      problemText: parsed.data.problemText ?? null,
      solutionText: parsed.data.solutionText ?? null,
      suitableCustomersText: parsed.data.suitableCustomersText ?? null,
      featuresText: parsed.data.featuresText ?? null,
      considerationsText: parsed.data.considerationsText ?? null,
      seoTitle: parsed.data.seoTitle ?? null,
      seoDescription: parsed.data.seoDescription ?? null,
      // Not authored through this admin form yet — see comment above.
      processText: null,
      equipmentText: null,
      warrantyText: null,
      faq: null,
    });
    return NextResponse.json({ service }, { status: 201 });
  });
}

export async function updateService(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = serviceSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    return NextResponse.json({ service: await container.services.update(id, parsed.data) });
  });
}

export async function archiveService(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    return NextResponse.json({ service: await container.services.archive(id) });
  });
}
