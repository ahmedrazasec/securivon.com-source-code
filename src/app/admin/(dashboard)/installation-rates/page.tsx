import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function InstallationRatesPage() {
  return (
    <div>
      <NotConnectedSection
        title="Installation Rates"
        description="One editable rate record per service (CCTV, Access Control, Intercom, Networking) — base per-unit rate, floor modifier, height/access modifier, conduit/trunking modifier, existing-vs-new cabling modifier, configuration fee, remote-view setup fee, and minimum charge."
        servicePath="src/server/services/installationRateService.ts"
        routePath="src/server/adminRoutes/pricing.ts"
        columns={["Service", "Base Rate", "Floor Mod.", "Access Mod.", "Min. Charge"]}
      />
      <div style={{ marginTop: 16, fontSize: 12, color: "#94A3B8", maxWidth: 640 }}>
        Every rate defaults to 0 until an Admin enters a real, confirmed figure — never a fabricated
        non-zero default. See src/server/repositories/prisma/installationRate.prisma.ts.
      </div>
    </div>
  );
}
