import "server-only";
import { prisma } from "@/server/db/client";
import type { ServiceRepository, ServiceRecord, ServiceCreateInput, ServiceUpdateInput } from "@/server/repositories/types";

/**
 * Real, database-backed ServiceRepository. Excluded from tsconfig — see
 * adminUser.prisma.ts.
 *
 * Boundary casts below follow the same pattern as
 * src/server/repositories/prisma/package.prisma.ts: `status` and `faq` are
 * kept as plain `string`/`unknown` in ServiceRecord (Prisma-free), so the
 * one narrowing cast happens only here.
 */
type ServiceCreateData = Parameters<typeof prisma.service.create>[0]["data"];
type ServiceUpdateData = Parameters<typeof prisma.service.update>[0]["data"];

export class PrismaServiceRepository implements ServiceRepository {
  async findById(id: string) {
    const s = await prisma.service.findUnique({ where: { id } });
    return s ? toRecord(s) : null;
  }
  async findBySlug(slug: string) {
    const s = await prisma.service.findUnique({ where: { slug } });
    return s ? toRecord(s) : null;
  }
  async list() {
    return (await prisma.service.findMany({ orderBy: { name: "asc" } })).map(toRecord);
  }
  async create(input: ServiceCreateInput) {
    const data: ServiceCreateData = {
      ...input,
      status: input.status as ServiceCreateData["status"],
      faq: input.faq as ServiceCreateData["faq"],
    };
    return toRecord(await prisma.service.create({ data }));
  }
  async update(id: string, input: ServiceUpdateInput) {
    const data: ServiceUpdateData = {
      ...input,
      status: input.status !== undefined ? (input.status as ServiceUpdateData["status"]) : undefined,
      faq: input.faq !== undefined ? (input.faq as ServiceUpdateData["faq"]) : undefined,
    };
    return toRecord(await prisma.service.update({ where: { id }, data }));
  }
  async archive(id: string) {
    return toRecord(await prisma.service.update({ where: { id }, data: { status: "ARCHIVED" } }));
  }
}

function toRecord(s: NonNullable<Awaited<ReturnType<typeof prisma.service.findUnique>>>): ServiceRecord {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    shortDescription: s.shortDescription,
    quoteOnly: s.quoteOnly,
    problemText: s.problemText,
    solutionText: s.solutionText,
    suitableCustomersText: s.suitableCustomersText,
    featuresText: s.featuresText,
    processText: s.processText,
    equipmentText: s.equipmentText,
    warrantyText: s.warrantyText,
    considerationsText: s.considerationsText,
    faq: s.faq,
    seoTitle: s.seoTitle,
    seoDescription: s.seoDescription,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
