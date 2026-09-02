import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Storage helper for the admin image-upload endpoint
 * (src/app/api/admin/upload/route.ts).
 *
 * SEPARATE from src/server/db/client.ts on purpose: that file talks to
 * Supabase's Postgres via a direct `DATABASE_URL` connection string
 * through Prisma — this file talks to Supabase's Storage REST API, which
 * needs the project URL + service-role key instead. They're two different
 * Supabase products (Postgres vs. Storage) with two different auth
 * mechanisms, so keeping them in separate modules avoids conflating
 * "database access" with "object storage access."
 *
 * SERVICE ROLE KEY: this client uses the service-role key, which bypasses
 * Row Level Security entirely. That's intentional and safe ONLY because
 * this module is `server-only` and is exclusively called from behind
 * withAdminAuth (see the upload route) — the key itself is never sent to
 * the browser. Do not import this module from any client component or
 * any route that isn't already gated by admin authentication.
 */

let cachedClient: ReturnType<typeof createClient> | null = null;

function getStorageClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new ImageUploadError(
      "Image upload is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set. " +
        "See .env.example. (The existing 'paste an image URL' workflow still works without these.)",
      500
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

export const CATALOGUE_MEDIA_BUCKET = "securivon-media";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

export class ImageUploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Creates the catalogue media bucket if it doesn't exist yet. Safe to call
 * on every upload — Storage's list/get-bucket call is cheap, and bucket
 * creation is idempotent (a second createBucket call for an existing
 * bucket returns a normal "already exists" error that we swallow).
 * This means there's no separate one-time setup script an admin has to
 * remember to run before the first upload works.
 */
async function ensureBucketExists(): Promise<void> {
  const client = getStorageClient();
  const { data: existing } = await client.storage.getBucket(CATALOGUE_MEDIA_BUCKET);
  if (existing) return;

  const { error } = await client.storage.createBucket(CATALOGUE_MEDIA_BUCKET, {
    public: true, // catalogue images are public-facing by design — same trust level as a pasted external URL
    fileSizeLimit: MAX_UPLOAD_BYTES,
  });
  // Ignore "already exists" races (two concurrent first-uploads); surface anything else.
  if (error && !/already exists/i.test(error.message)) {
    throw new ImageUploadError(`Could not create storage bucket: ${error.message}`, 500);
  }
}

/**
 * Uploads a single catalogue image and returns its public URL.
 *
 * @param entityType "product" | "package" | "guide" — used only to namespace the
 *   storage path for human readability; not read back by any other code.
 * @param file The uploaded file (from a multipart FormData request).
 */
export async function uploadCatalogueImage(
  entityType: "product" | "package" | "guide",
  file: File
): Promise<{ url: string; path: string }> {
  const extension = ALLOWED_MIME_TYPES[file.type];
  if (!extension) {
    throw new ImageUploadError(
      `Unsupported image type "${file.type || "unknown"}". Allowed: JPEG, PNG, WebP, GIF.`
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageUploadError(`Image is too large (${Math.round(file.size / 1024 / 1024)}MB). Max 8MB.`);
  }
  if (file.size === 0) {
    throw new ImageUploadError("Uploaded file is empty.");
  }

  await ensureBucketExists();

  const path = `${entityType}s/${crypto.randomUUID()}.${extension}`;
  const client = getStorageClient();

  const { error } = await client.storage.from(CATALOGUE_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new ImageUploadError(`Upload failed: ${error.message}`, 500);
  }

  const { data: publicUrlData } = client.storage.from(CATALOGUE_MEDIA_BUCKET).getPublicUrl(path);
  return { url: publicUrlData.publicUrl, path };
}
