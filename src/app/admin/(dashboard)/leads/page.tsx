"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useAdminListQuery } from "@/lib/admin/useAdminListQuery";
import { PageHeader, Select, Badge, Table, EmptyRow, ErrorBanner, Modal, Spinner, colors } from "@/components/admin/ui";

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  addressArea: string | null;
  source: string;
  createdAt: string;
}

interface LeadListItem {
  id: string;
  journeySource: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CustomerSummary;
  quoteCount: number;
  siteSurveyRequestCount: number;
}

interface QuoteSummary {
  id: string;
  status: string;
  type: string;
  totalEstimatedLow: number | null;
  totalEstimatedHigh: number | null;
  isEstimateOnly: boolean;
  siteSurveyRequired: boolean;
  createdAt: string;
}

interface SiteSurveySummary {
  id: string;
  status: string;
  propertyType: string;
  location: string;
  preferredDateTime: string | null;
  createdAt: string;
}

interface LeadDetail extends LeadListItem {
  quotes: QuoteSummary[];
  siteSurveyRequests: SiteSurveySummary[];
}

const STATUSES = ["NEW", "CONTACTED", "SITE_SURVEY_SCHEDULED", "QUOTED", "WON", "LOST"];

function formatPkr(low: number | null, high: number | null) {
  if (low == null && high == null) return "—";
  if (low != null && high != null && low !== high) return `${low.toLocaleString()}–${high.toLocaleString()} PKR`;
  return `${(low ?? high)!.toLocaleString()} PKR`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export default function LeadsPage() {
  const [status, setStatus] = useState("");
  const q = useAdminListQuery<LeadListItem, LeadDetail>({
    listUrl: "/api/admin/leads",
    listKey: "leads",
    itemUrl: (id) => `/api/admin/leads/${id}`,
    itemKey: "lead",
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
        title="Leads"
        description="Every customer contact captured from the site — Request Quote form and Configurator hand-offs. Read-only view of the real submission data."
      />

      {q.loadError && <ErrorBanner>{q.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 220, marginBottom: 16 }}>
        <Select
          value={status}
          onChange={setStatus}
          placeholder="All statuses"
          options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
        />
      </div>

      {q.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Customer", "Phone", "Source", "Status", "Quotes", "Surveys", "Received", ""]}>
          {q.items.length === 0 ? (
            <EmptyRow colSpan={8}>No leads yet.</EmptyRow>
          ) : (
            q.items.map((lead) => (
              <tr key={lead.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{lead.customer.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{lead.customer.phone}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{lead.journeySource.replace(/_/g, " ")}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={lead.status} />
                </td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{lead.quoteCount}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{lead.siteSurveyRequestCount}</td>
                <td style={{ padding: "10px 14px", color: colors.slate, whiteSpace: "nowrap" }}>{formatDateTime(lead.createdAt)}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <button
                    onClick={() => openDetail(lead.id)}
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
          title="Lead details"
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
                {q.detail.customer.whatsappNumber && <DetailRow label="WhatsApp" value={q.detail.customer.whatsappNumber} />}
                {q.detail.customer.email && <DetailRow label="Email" value={q.detail.customer.email} />}
                {q.detail.customer.addressArea && <DetailRow label="Area" value={q.detail.customer.addressArea} />}
                <DetailRow label="Source" value={q.detail.customer.source.replace(/_/g, " ")} />
              </section>

              <section style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Lead</h3>
                <DetailRow label="Status" value={<Badge value={q.detail.status} />} />
                <DetailRow label="Journey source" value={q.detail.journeySource.replace(/_/g, " ")} />
                <DetailRow label="Assigned to" value={q.detail.assignedTo ?? "Unassigned"} />
                <DetailRow label="Received" value={formatDateTime(q.detail.createdAt)} />
              </section>

              <section style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>
                  Quotes ({q.detail.quotes.length})
                </h3>
                {q.detail.quotes.length === 0 ? (
                  <p style={{ color: colors.slateLight }}>No quotes generated for this lead.</p>
                ) : (
                  q.detail.quotes.map((quote) => (
                    <div key={quote.id} style={{ padding: "8px 0", borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>
                          {quote.type.replace(/_/g, " ")} — <Badge value={quote.status} />
                        </span>
                        <span style={{ color: colors.slate }}>
                          {quote.isEstimateOnly ? "Estimate: " : "Total: "}
                          {formatPkr(quote.totalEstimatedLow, quote.totalEstimatedHigh)}
                        </span>
                      </div>
                      {quote.siteSurveyRequired && (
                        <div style={{ fontSize: 12, color: colors.warn, marginTop: 2 }}>Site survey required</div>
                      )}
                    </div>
                  ))
                )}
              </section>

              <section>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>
                  Site survey requests ({q.detail.siteSurveyRequests.length})
                </h3>
                {q.detail.siteSurveyRequests.length === 0 ? (
                  <p style={{ color: colors.slateLight }}>No site survey requests for this lead.</p>
                ) : (
                  q.detail.siteSurveyRequests.map((s) => (
                    <div key={s.id} style={{ padding: "8px 0", borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>
                          {s.propertyType} — {s.location}
                        </span>
                        <Badge value={s.status} />
                      </div>
                      {s.preferredDateTime && (
                        <div style={{ fontSize: 12, color: colors.slate, marginTop: 2 }}>Preferred: {s.preferredDateTime}</div>
                      )}
                    </div>
                  ))
                )}
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
