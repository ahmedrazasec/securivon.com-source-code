import type { Metadata } from "next";
import ConfiguratorClient from "./ConfiguratorClient";

export const metadata: Metadata = {
  title: "Instant Estimate Configurator",
  description:
    "Answer a few questions about your property to get an honest, itemized CCTV or security system estimate — or an on-site survey when your setup needs one.",
  alternates: { canonical: "/configurator" },
};

/**
 * Thin server-component wrapper so this page can carry real metadata —
 * ConfiguratorClient (formerly this file's default export) is a "use
 * client" component and can't export `metadata` itself. No behavior
 * changed; the entire configurator implementation still lives in
 * ConfiguratorClient.tsx untouched.
 */
export default function ConfiguratorPage() {
  return <ConfiguratorClient />;
}
