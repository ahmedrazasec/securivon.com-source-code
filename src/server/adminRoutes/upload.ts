import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { uploadCatalogueImage, ImageUploadError } from "@/server/storage/supabaseStorage";

/**
 * Admin catalogue-image upload endpoint.
 *
 * Accepts multipart/form-data with:
 *   - "file": the image blob
 *   - "entityType": "product" | "package" | "guide"
 *
 * Returns { url } on success — the caller (admin Product/Package/Guide
 * form) appends { url, alt: "" } to the existing `images` array exactly as
 * it already does for a pasted external URL. This endpoint does NOT touch
 * the Product/Package/Guide repositories or database at all — it only
 * produces a URL. Saving that URL onto a specific record still goes
 * through the existing PATCH /api/admin/products/[id],
 * /api/admin/packages/[id], or /api/admin/guides/[id] routes, unchanged.
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, "EDIT_CONTENT", async () => {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    }

    const file = formData.get("file");
    const entityType = formData.get("entityType");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (entityType !== "product" && entityType !== "package" && entityType !== "guide") {
      return NextResponse.json({ error: "Invalid entityType." }, { status: 400 });
    }

    try {
      const { url } = await uploadCatalogueImage(entityType, file);
      return NextResponse.json({ url });
    } catch (error) {
      if (error instanceof ImageUploadError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error; // handled generically by withAdminAuth's catch
    }
  });
}
