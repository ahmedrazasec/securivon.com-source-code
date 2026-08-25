import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";

/**
 * Products Admin route handlers.
 *
 * Mounted at src/app/api/admin/products/route.ts (GET, POST) and
 * src/app/api/admin/products/[id]/route.ts (GET, PATCH, DELETE) — those
 * files re-export/adapt the functions below rather than duplicating logic.
 * Edit request handling here; edit routing/param-adaptation there.
 */

const productWriteSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().nullable().optional(),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  productType: z.string().min(1),
  shortDescription: z.string().nullable().optional(),
  longDescription: z.string().nullable().optional(),
  useCases: z.array(z.string()).default([]),
  warrantyId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  supplierCost: z.number().nullable().optional(),
  customerPriceType: z.enum(["FIXED", "STARTING_FROM", "RANGE", "ESTIMATED", "QUOTE_ONLY"]),
  customerPriceValue: z.number().nullable().optional(),
  customerPriceValueMax: z.number().nullable().optional(),
  installationPriceType: z.enum(["FIXED", "STARTING_FROM", "RANGE", "ESTIMATED", "QUOTE_ONLY"]),
  installationPriceValue: z.number().nullable().optional(),
  installationPriceValueMax: z.number().nullable().optional(),
  pricingStatus: z.enum(["VERIFIED", "NEEDS_REVIEW", "STALE"]).default("NEEDS_REVIEW"),
  availability: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "ORDER_REQUIRED", "DISCONTINUED", "UNKNOWN"]),
  verificationDate: z.string().nullable().optional(),
  configuratorTags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function GET(request: NextRequest) {
  return withAdminAuth(request, "VIEW_ADMIN", async () => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED" | null;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const products = await container.products.list({ status: status ?? undefined, categoryId });
    return NextResponse.json({ products });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, "EDIT_CONTENT", async (session) => {
    const body = await request.json().catch(() => null);
    const parsed = productWriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    }
    const product = await container.products.create(session.sub, {
      ...parsed.data,
      sku: parsed.data.sku ?? null,
      shortDescription: parsed.data.shortDescription ?? null,
      longDescription: parsed.data.longDescription ?? null,
      warrantyId: parsed.data.warrantyId ?? null,
      supplierId: parsed.data.supplierId ?? null,
      supplierCost: parsed.data.supplierCost ?? null,
      customerPriceValue: parsed.data.customerPriceValue ?? null,
      customerPriceValueMax: parsed.data.customerPriceValueMax ?? null,
      installationPriceValue: parsed.data.installationPriceValue ?? null,
      installationPriceValueMax: parsed.data.installationPriceValueMax ?? null,
      images: null,
      specifications: null,
      priceEffectiveDate: null,
      priceReviewDueDate: null,
      verificationDate: parsed.data.verificationDate ?? null,
      sourceUrl: null,
    });
    return NextResponse.json({ product }, { status: 201 });
  });
}

// --- [id] variant — move into src/app/api/admin/products/[id]/route.ts ---

export async function GET_ONE(request: NextRequest, id: string) {
  return withAdminAuth(request, "VIEW_ADMIN", async () => {
    const product = await container.products.findById(id);
    if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ product });
  });
}

export async function PATCH_ONE(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async (session) => {
    const body = await request.json().catch(() => null);
    const parsed = productWriteSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    }
    try {
      const product = await container.products.update(session.sub, id, parsed.data);
      return NextResponse.json({ product });
    } catch {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
  });
}

export async function ARCHIVE_ONE(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_CONTENT", async (session) => {
    try {
      const product = await container.products.archive(session.sub, id);
      return NextResponse.json({ product });
    } catch {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
  });
}
