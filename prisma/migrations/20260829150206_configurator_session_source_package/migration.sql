-- AlterTable
ALTER TABLE "ConfiguratorSession" ADD COLUMN "sourcePackageId" TEXT;

-- CreateIndex
CREATE INDEX "ConfiguratorSession_sourcePackageId_idx" ON "ConfiguratorSession"("sourcePackageId");

-- AddForeignKey
ALTER TABLE "ConfiguratorSession" ADD CONSTRAINT "ConfiguratorSession_sourcePackageId_fkey" FOREIGN KEY ("sourcePackageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
