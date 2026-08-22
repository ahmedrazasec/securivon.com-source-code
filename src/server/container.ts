import "server-only";
import { PrismaProductRepository } from "@/server/repositories/prisma/product.prisma";
import { PrismaCategoryRepository } from "@/server/repositories/prisma/category.prisma";
import { PrismaBrandRepository } from "@/server/repositories/prisma/brand.prisma";
import { PrismaSupplierRepository } from "@/server/repositories/prisma/supplier.prisma";
import { PrismaWarrantyRepository } from "@/server/repositories/prisma/warranty.prisma";
import { PrismaPackageRepository } from "@/server/repositories/prisma/package.prisma";
import { PrismaInstallationRateRepository } from "@/server/repositories/prisma/installationRate.prisma";
import { PrismaPricingAuditLogRepository } from "@/server/repositories/prisma/pricingAuditLog.prisma";
import { PrismaAdminUserRepository } from "@/server/repositories/prisma/adminUser.prisma";
import { ProductAdminService } from "@/server/services/productService";
import { PackageAdminService } from "@/server/services/packageService";
import { InstallationRateAdminService } from "@/server/services/installationRateService";

/**
 * Application container — the single place that wires real, database-backed
 * repositories to the service layer for use by Admin route handlers.
 *
 * Excluded from tsconfig (see tsconfig.json) for the same reason as every
 * file it imports — it transitively depends on src/server/db/client.ts,
 * which requires `npx prisma generate` to have succeeded. Once that's true
 * in your environment, this file needs no changes; just remove the
 * tsconfig exclusions for this file and the repositories/prisma directory.
 *
 * Route handlers (src/server/adminRoutes/*.ts, ready to be moved into
 * src/app/api/admin/.../route.ts once Prisma is available) should import
 * from here rather than constructing repositories/services themselves, so
 * there's exactly one place that decides which repository implementation
 * is "real" for a given entity.
 */

const auditLog = new PrismaPricingAuditLogRepository();

export const container = {
  products: new ProductAdminService(new PrismaProductRepository(), auditLog),
  categories: new PrismaCategoryRepository(),
  brands: new PrismaBrandRepository(),
  suppliers: new PrismaSupplierRepository(),
  warranties: new PrismaWarrantyRepository(),
  packages: new PackageAdminService(new PrismaPackageRepository(), auditLog),
  installationRates: new InstallationRateAdminService(new PrismaInstallationRateRepository(), auditLog),
  auditLog,
  // Real Admin authentication backend. NOT wired into
  // src/server/repositories/adminUserRepository.ts's getAdminUserRepository()
  // yet — see that file's updated header comment for exactly why (empirically
  // verified to break both `tsc --noEmit` and `next build` in an environment
  // where `npx prisma generate` hasn't succeeded) and the one-line change
  // required to activate it once it has.
  adminUsers: new PrismaAdminUserRepository(),
};
