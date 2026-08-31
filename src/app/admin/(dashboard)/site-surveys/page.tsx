"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useAdminListQuery } from "@/lib/admin/useAdminListQuery";
import { PageHeader, Select, Badge, Table, EmptyRow, ErrorBanner, Modal, Spinner, Button, colors } from "@/components/admin/ui";

interface SiteSurveyListItem {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  propertyType: string;
  location: string;
  preferredDateTime: string | null;
  configurationReference: string | null;
  status: string;
  createdAt: string;
}

interface CustomerSummary {
  name: string;
  phone: string;
  email: string | null;
}

interface SiteSurveyDetail extends SiteSurveyListItem {
  notes: string | null;
  customer: CustomerSummary;
}

const STATUSES = ["REQUESTED", "SCHEDULED", "COMPLETED", "CANCELLED"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export default function SiteSurveysPage() {
  const [status, setStatus] = useState("");
  const q = useAdminListQuery<SiteSurveyListItem, SiteSurveyDetail>({
    listUrl: "/api/admin/site-surveys",
    listKey: "siteSurveys",
    itemUrl: (id) => `/api/admin/site-surveys/${id}`,
    itemKey: "siteSurvey",
    status: status || undefined,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState("");

  function openDetail(id: string) {
    setSelectedId(id);
    setPendingStatus("");
    q.loadDetail(id);
  }

  async function handleUpdateStatus() {
    if (!selectedId || !pendingStatus) return;
    const ok = await q.updateStatus(selectedId, pendingStatus);
    if (ok) setPendingStatus("");
  }

  return (
    <div>
      <PageHeader
        title="Site Surveys"
        description="Requests where an honest on-the-spot estimate wasn't possible — fire/intrusion or otherwise routed by the site-survey rule engine. Update status here as you schedule/complete these."
      />

      {q.loadError && <ErrorBanner>{q.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 220, marginBottom: 16 }}>
        <Select value={status} onChange={setStatus} placeholder="All statuses" options={STATUSES.map((s) => ({ value: s, label: s }))} />
      </div>

      {q.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "Phone", "Property", "Location", "Status", "Requested", ""]}>
          {q.items.length === 0 ? (
            <EmptyRow colSpan={7}>No site survey requests yet.</EmptyRow>
          ) : (
            q.items.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{s.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{s.phone}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{s.propertyType}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{s.location}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={s.status} />
                </td>
                <td style={{ padding: "10px 14px", color: colors.slate, whiteSpace: "nowrap" }}>{formatDateTime(s.createdAt)}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <button
                    onClick={() => openDetail(s.id)}
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
          title="Site survey request"
          onClose={() => {
            setSelectedId(null);
            q.clearDetail();
          }}
        >
          {q.detailLoading && <Spinner />}
          {q.detailError && <ErrorBanner>{q.detailError}</ErrorBanner>}
          {q.detail && (
            <div style={{ fontSize: 13 }}>
              <DetailRow label="Name" value={q.detail.name} />
              <DetailRow label="Phone" value={q.detail.phone} />
              {q.detail.customer.email && <DetailRow label="Email" value={q.detail.customer.email} />}
              <DetailRow label="Property type" value={q.detail.propertyType} />
              <DetailRow label="Location" value={q.detail.location} />
              <DetailRow label="Status" value={<Badge value={q.detail.status} />} />
              {q.detail.preferredDateTime && <DetailRow label="Preferred time" value={q.detail.preferredDateTime} />}
              {q.detail.configurationReference && (
                <DetailRow label="Configurator session" value={q.detail.configurationReference} />
              )}
              <DetailRow label="Requested" value={formatDateTime(q.detail.createdAt)} />

              {q.updateError && <ErrorBanner>{q.updateError}</ErrorBanner>}
              <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 12, alignItems: "center" }}>
                <div style={{ maxWidth: 200, flex: 1 }}>
                  <Select
                    value={pendingStatus}
                    onChange={setPendingStatus}
                    placeholder="Change status to…"
                    options={STATUSES.filter((s) => s !== q.detail!.status).map((s) => ({ value: s, label: s }))}
                  />
                </div>
                <Button onClick={handleUpdateStatus} disabled={!pendingStatus || q.updating}>
                  {q.updating ? "Saving…" : "Update"}
                </Button>
              </div>
              {q.detail.notes && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ color: colors.slate, display: "block", marginBottom: 4 }}>Notes</span>
                  <p style={{ color: colors.ink, whiteSpace: "pre-wrap" }}>{q.detail.notes}</p>
                </div>
              )}
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
