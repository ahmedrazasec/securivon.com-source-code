import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";

/**
 * Packages (+ PackageItem) Admin route handlers.
 *
 * Mounted at src/app/api/admin/packages/route.ts (GET, POST),
 * .../[id]/route.ts (PATCH, DELETE), .../[id]/items/route.ts (POST),
 * .../[id]/items/[itemId]/route.ts (PATCH, DELETE), and
 * .../[id]/items/reorder/route.ts (POST) — those files re-export/adapt
 * the functions below rather than duplicating logic. Edit request
 * handling here; edit routing/param-adaptation there.
 */

const packageSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  targetCustomerDescription: z.string().nullable().optional(),
  category: z.enum(["HOME_STARTER", "HOME_COMPLETE", "SHOP_RETAIL", "OFFICE", "RESTAURANT_CAFE", "CUSTOM"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  priceType: z.enum(["FIXED", "STARTING_FROM", "RANGE", "ESTIMATED", "QUOTE_ONLY"]).default("QUOTE_ONLY"),
  priceValue: z.number().nullable().optional(),
  priceValueMax: z.number().nullable().optional(),
});

const packageItemSchema = z.object({
  // Package items must reference an actual product ID — this route does
  // not (and should not) duplicate product master data; it only validates
  // that a productId string was provided. Confirming the product actually
  // exists is done via container.products.findById before insert, below.
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  requirement: z.enum(["REQUIRED", "OPTIONAL"]).default("REQUIRED"),
  inclusionStatus: z.enum(["INCLUDED", "EXCLUDED", "OPTIONAL_ADDON"]).default("INCLUDED"),
  priceOverride: z.number().nullable().optional(),
  customerFacingDescription: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
});

export async function listPackages(request: NextRequest) {
  return withAdminAuth(request, "VIEW_ADMIN", async () => {
    return NextResponse.json({ packages: await container.packages.list() });
  });
}

export async function createPackage(request: NextRequest) {
  return withAdminAuth(request, "EDIT_CONTENT", async (session) => {
    const parsed = packageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const pkg = await container.packages.create(session.sub, {
      ...parsed.data,
      targetCustomerDescription: parsed.data.targetCustomerDescription ?? null,
      priceValue: parsed.data.priceValue ?? null,
      priceValueMax: parsed.data.priceValueMax ?? null,
    });
    return NextResponse.json({ package: pkg }, { status: 201 });
  });
}

export async function updatePackage(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async (session) => {
    const parsed = packageSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    try {
      return NextResponse.json({ package: await container.packages.update(session.sub, id, parsed.data) });
    } catch {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
  });
}

export async function archivePackage(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async (session) => {
    try {
      return NextResponse.json({ package: await container.packages.archive(session.sub, id) });
    } catch {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
  });
}

export async function addPackageItem(request: NextRequest, packageId: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = packageItemSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

    // Enforce "package items must reference actual products" at the API
    // boundary, not just trust the client-supplied productId.
    const product = await container.products.findById(parsed.data.productId);
    if (!product) {
      return NextResponse.json({ error: "productId does not reference an existing product." }, { status: 400 });
    }

    const pkg = await container.packages.addItem(packageId, {
      ...parsed.data,
      priceOverride: parsed.data.priceOverride ?? null,
      customerFacingDescription: parsed.data.customerFacingDescription ?? null,
      internalNotes: parsed.data.internalNotes ?? null,
    });
    return NextResponse.json({ package: pkg }, { status: 201 });
  });
}

export async function updatePackageItem(request: NextRequest, packageId: string, itemId: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const parsed = packageItemSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const pkg = await container.packages.updateItem(packageId, itemId, parsed.data);
    return NextResponse.json({ package: pkg });
  });
}

export async function removePackageItem(request: NextRequest, packageId: string, itemId: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const pkg = await container.packages.removeItem(packageId, itemId);
    return NextResponse.json({ package: pkg });
  });
}

export async function reorderPackageItems(request: NextRequest, packageId: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ orderedItemIds: z.array(z.string()) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const pkg = await container.packages.reorderItems(packageId, parsed.data.orderedItemIds);
    return NextResponse.json({ package: pkg });
  });
}
