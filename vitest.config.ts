import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Every server-side module in this project imports "server-only" as a
      // guard against accidental client-bundle usage (see e.g.
      // src/server/pricing/engine.ts). That package throws unconditionally
      // unless resolved under React's "react-server" export condition, which
      // Next.js's real server bundler sets automatically but a plain Vitest/
      // Node run does not. Rather than depend on export-condition wiring
      // (attempted first; did not reliably take effect under this Vitest
      // version's config loader), alias the package directly to a local
      // no-op stub for tests only. Production behavior is unaffected: this
      // alias only exists in vitest.config.ts, never in the app's real
      // build, so 'server-only' still throws correctly if a guarded module
      // is ever actually imported into a client component.
      "server-only": path.resolve(__dirname, "./test/stubs/server-only.ts"),
      "@test-fakes": path.resolve(__dirname, "./test/fakes"),
    },
  },
});
