import "server-only";
import { prisma } from "@/server/db/client";
import type { GuideRepository, GuideRecord, GuideCreateInput, GuideUpdateInput } from "@/server/repositories/types";

/**
 * Real, database-backed GuideRepository. Excluded from tsconfig — see
 * adminUser.prisma.ts.
 *
 * Boundary casts below follow the same pattern as
 * src/server/repositories/prisma/service.prisma.ts (status) and
 * src/server/repositories/prisma/product.prisma.ts (images): GuideRecord
 * keeps `status` as a plain string and `images` as `unknown` so business
 * logic/tests never depend on generated Prisma types — the one narrowing
 * cast happens only here, right before the actual Prisma call.
 */
type GuideCreateData = Parameters<typeof prisma.guide.create>[0]["data"];
type GuideUpdateData = Parameters<typeof prisma.guide.update>[0]["data"];

export class PrismaGuideRepository implements GuideRepository {
  async findById(id: string) {
    const g = await prisma.guide.findUnique({ where: { id } });
    return g ? toRecord(g) : null;
  }
  async findBySlug(slug: string) {
    const g = await prisma.guide.findUnique({ where: { slug } });
    return g ? toRecord(g) : null;
  }
  async list() {
    return (await prisma.guide.findMany({ orderBy: { createdAt: "desc" } })).map(toRecord);
  }
  async create(input: GuideCreateInput) {
    const data: GuideCreateData = {
      ...input,
      status: input.status as GuideCreateData["status"],
      images: input.images as GuideCreateData["images"],
      publishedAt: input.publishedAt as GuideCreateData["publishedAt"],
    };
    return toRecord(await prisma.guide.create({ data }));
  }
  async update(id: string, input: GuideUpdateInput) {
    const data: GuideUpdateData = {
      ...input,
      status: input.status !== undefined ? (input.status as GuideUpdateData["status"]) : undefined,
      images: input.images !== undefined ? (input.images as GuideUpdateData["images"]) : undefined,
      publishedAt: input.publishedAt !== undefined ? (input.publishedAt as GuideUpdateData["publishedAt"]) : undefined,
    };
    return toRecord(await prisma.guide.update({ where: { id }, data }));
  }
  async archive(id: string) {
    return toRecord(await prisma.guide.update({ where: { id }, data: { status: "ARCHIVED" } }));
  }
}

function toRecord(g: NonNullable<Awaited<ReturnType<typeof prisma.guide.findUnique>>>): GuideRecord {
  return {
    id: g.id,
    slug: g.slug,
    title: g.title,
    body: g.body,
    images: g.images,
    seoTitle: g.seoTitle,
    seoDescription: g.seoDescription,
    status: g.status,
    publishedAt: g.publishedAt ? g.publishedAt.toISOString() : null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}
