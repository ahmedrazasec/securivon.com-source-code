import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/marketing/Primitives";
import { PackageCard } from "@/components/marketing/PackageCard";
import { Button, Card } from "@/components/marketing/ui";
import { getPublicPackageCatalogue } from "@/server/publicRoutes/packages";

export const metadata: Metadata = {
  title: "Packages",
  description: "Ready-made CCTV and security packages from Securivon.",
  alternates: { canonical: "/packages" },
};

export default async function PackagesPage() {
  const packages = await getPublicPackageCatalogue();

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Packages"
        title="Ready-made security packages"
        description="A starting point for common setups — what's included, camera count, and storage at a glance. Every package can be adjusted to your property in the Configurator or by requesting a quote."
      />

      {packages.length === 0 ? (
        <EmptyPackagesState />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </Container>
  );
}

function EmptyPackagesState() {
  return (
    <Card className="mt-10 p-8 text-center">
      <p className="text-sm leading-relaxed text-slate">
        We&rsquo;re putting together ready-made packages for common setups. Until then, request a quote or use the
        Configurator and we&rsquo;ll put one together for your property directly.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Button href="/request-quote">Request a Quote</Button>
        <Button href="/configurator" variant="ghost">
          Use the Configurator →
        </Button>
      </div>
    </Card>
  );
}
