"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useAdminListQuery } from "@/lib/admin/useAdminListQuery";
import { PageHeader, Select, Badge, Table, EmptyRow, ErrorBanner, Modal, Spinner, colors } from "@/components/admin/ui";

interface CustomerSummary {
  name: string;
  phone: string;
  email: string | null;
}

interface QuoteListItem {
  id: string;
  leadId: string;
  packageId: string | null;
  type: string;
  status: string;
  totalEstimatedLow: number | null;
  totalEstimatedHigh: number | null;
  isEstimateOnly: boolean;
  siteSurveyRequired: boolean;
  validUntil: string | null;
  createdAt: string;
  customer: CustomerSummary;
}

interface QuoteItem {
  id: string;
  itemType: string;
  description: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotal: number;
}

interface QuoteDetail extends QuoteListItem {
  configurationSnapshot: unknown;
  pricingRulesSnapshot: unknown;
  items: QuoteItem[];
}

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "EXPIRED"];

function formatPkr(low: number | null, high: number | null) {
  if (low == null && high == null) return "—";
  if (low != null && high != null && low !== high) return `${low.toLocaleString()}–${high.toLocaleString()} PKR`;
  return `${(low ?? high)!.toLocaleString()} PKR`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export default function QuotesPage() {
  const [status, setStatus] = useState("");
  const q = useAdminListQuery<QuoteListItem, QuoteDetail>({
    listUrl: "/api/admin/quotes",
    listKey: "quotes",
    itemUrl: (id) => `/api/admin/quotes/${id}`,
    itemKey: "quote",
    status: status || undefined,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function openDetail(id: string) {
    setSelectedId(id);
    q.loadDetail(id);
  }

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Every Quote is a frozen snapshot taken at submission time — Admin pricing changes never retroactively alter one. Read-only view."
      />

      {q.loadError && <ErrorBanner>{q.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 220, marginBottom: 16 }}>
        <Select value={status} onChange={setStatus} placeholder="All statuses" options={STATUSES.map((s) => ({ value: s, label: s }))} />
      </div>

      {q.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Customer", "Type", "Status", "Estimate / Total", "Survey req.", "Created", ""]}>
          {q.items.length === 0 ? (
            <EmptyRow colSpan={7}>No quotes yet.</EmptyRow>
          ) : (
            q.items.map((quote) => (
              <tr key={quote.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{quote.customer.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{quote.type.replace(/_/g, " ")}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={quote.status} />
                </td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>
                  {formatPkr(quote.totalEstimatedLow, quote.totalEstimatedHigh)}
                  {quote.isEstimateOnly && <span style={{ marginLeft: 6 }}><Badge value="QUOTE_ONLY" /></span>}
                </td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{quote.siteSurveyRequired ? "Yes" : "No"}</td>
                <td style={{ padding: "10px 14px", color: colors.slate, whiteSpace: "nowrap" }}>{formatDateTime(quote.createdAt)}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <button
                    onClick={() => openDetail(quote.id)}
                    style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13 }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </Table>
      )}

      {selectedId && (
        <Modal
          title="Quote details"
          onClose={() => {
            setSelectedId(null);
            q.clearDetail();
          }}
          wide
        >
          {q.detailLoading && <Spinner />}
          {q.detailError && <ErrorBanner>{q.detailError}</ErrorBanner>}
          {q.detail && (
            <div style={{ fontSize: 13 }}>
              <section style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Customer</h3>
                <DetailRow label="Name" value={q.detail.customer.name} />
                <DetailRow label="Phone" value={q.detail.customer.phone} />
                {q.detail.customer.email && <DetailRow label="Email" value={q.detail.customer.email} />}
              </section>

              <section style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Quote</h3>
                <DetailRow label="Status" value={<Badge value={q.detail.status} />} />
                <DetailRow label="Type" value={q.detail.type.replace(/_/g, " ")} />
                <DetailRow label="Estimate / total" value={formatPkr(q.detail.totalEstimatedLow, q.detail.totalEstimatedHigh)} />
                <DetailRow label="Estimate only" value={q.detail.isEstimateOnly ? "Yes" : "No"} />
                <DetailRow label="Site survey required" value={q.detail.siteSurveyRequired ? "Yes" : "No"} />
                {q.detail.validUntil && <DetailRow label="Valid until" value={formatDateTime(q.detail.validUntil)} />}
                <DetailRow label="Created" value={formatDateTime(q.detail.createdAt)} />
              </section>

              <section style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>
                  Line items ({q.detail.items.length})
                </h3>
                {q.detail.items.length === 0 ? (
                  <p style={{ color: colors.slateLight }}>No line items — this quote is an estimate range only, not itemized.</p>
                ) : (
                  <Table columns={["Description", "Qty", "Unit price", "Line total"]}>
                    {q.detail.items.map((item) => (
                      <tr key={item.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "8px 10px" }}>{item.description}</td>
                        <td style={{ padding: "8px 10px" }}>{item.quantity}</td>
                        <td style={{ padding: "8px 10px" }}>{item.unitPriceSnapshot.toLocaleString()} PKR</td>
                        <td style={{ padding: "8px 10px" }}>{item.lineTotal.toLocaleString()} PKR</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </section>

              <section>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>
                  Frozen snapshot (as submitted)
                </h3>
                <p style={{ color: colors.slateLight, marginBottom: 8 }}>
                  Exactly what was captured at submission time — never recalculated from current pricing.
                </p>
                <pre
                  style={{
                    background: colors.headerBg,
                    borderRadius: 6,
                    padding: 10,
                    fontSize: 11,
                    overflowX: "auto",
                    color: colors.ink,
                    maxHeight: 220,
                  }}
                >
                  {JSON.stringify(q.detail.configurationSnapshot, null, 2)}
                </pre>
              </section>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ color: colors.slate }}>{label}</span>
      <span style={{ color: colors.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
