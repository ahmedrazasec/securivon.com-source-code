import { describe, expect, it } from "vitest";
import { uploadCatalogueImage, ImageUploadError, MAX_UPLOAD_BYTES } from "./supabaseStorage";

/**
 * These tests cover only the validation branches of uploadCatalogueImage()
 * that run BEFORE any Supabase network call (mime-type check, size check,
 * empty-file check) — no live Supabase connection needed for these paths,
 * matching this codebase's usual "pure function first" testability
 * preference even for an inherently I/O-bound module. The actual upload
 * call itself is a thin wrapper around the Supabase SDK, verified by
 * manual/browser testing rather than a mocked network test, consistent
 * with how src/server/repositories/prisma/*.prisma.ts files are treated
 * elsewhere in this codebase.
 */

function fakeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("uploadCatalogueImage validation", () => {
  it("rejects an unsupported mime type before attempting any upload", async () => {
    const file = fakeFile("doc.pdf", "application/pdf", 1024);
    await expect(uploadCatalogueImage("product", file)).rejects.toThrow(ImageUploadError);
    await expect(uploadCatalogueImage("product", file)).rejects.toThrow(/Unsupported image type/);
  });

  it("rejects a file over the size limit", async () => {
    const file = fakeFile("huge.jpg", "image/jpeg", MAX_UPLOAD_BYTES + 1);
    await expect(uploadCatalogueImage("package", file)).rejects.toThrow(/too large/);
  });

  it("rejects an empty file", async () => {
    const file = fakeFile("empty.png", "image/png", 0);
    await expect(uploadCatalogueImage("product", file)).rejects.toThrow(/empty/);
  });

  it("accepts all four documented mime types at the validation stage (fails later only on missing Supabase config, not on type)", async () => {
    const types = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    for (const type of types) {
      const file = fakeFile("ok.img", type, 1024);
      // Past validation, this will throw when it reaches getStorageClient()
      // because SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY aren't set in the
      // test environment — that's the expected failure point, and it
      // proves the mime-type/size checks above did NOT reject the file.
      await expect(uploadCatalogueImage("product", file)).rejects.toThrow(/not configured/);
    }
  });

  it("throws ImageUploadError (not a plain Error) when Supabase env vars are missing, so the real message reaches the admin instead of a generic 500", async () => {
    // Regression test: this check previously used `throw new Error(...)`
    // instead of `throw new ImageUploadError(...)`, which meant the
    // upload route's `if (error instanceof ImageUploadError)` branch never
    // matched, the specific "not configured" message was discarded, and
    // withAdminAuth's generic catch-all returned an unhelpful
    // "Internal server error." to the admin UI instead.
    const file = fakeFile("ok.jpg", "image/jpeg", 1024);
    await expect(uploadCatalogueImage("product", file)).rejects.toBeInstanceOf(ImageUploadError);
  });
});
