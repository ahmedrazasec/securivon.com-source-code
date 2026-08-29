import type { Metadata } from "next";
import RequestQuoteForm from "./RequestQuoteForm";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Tell us about your property and security needs — we'll get back to you with next steps, or an honest estimate where one can be given online.",
  alternates: { canonical: "/request-quote" },
};

/**
 * Thin server-component wrapper so this page can carry real metadata —
 * RequestQuoteForm (formerly this file's default export) is a "use client"
 * component and can't export `metadata` itself. No behavior changed; the
 * entire form implementation still lives in RequestQuoteForm.tsx untouched.
 */
export default function RequestQuotePage() {
  return <RequestQuoteForm />;
}
