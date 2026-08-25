"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Shared Admin UI primitives.
 *
 * Matches the palette/style already established in AdminNav.tsx and
 * NotConnectedSection.tsx (inline styles, not Tailwind) rather than
 * introducing a second styling system into the Admin section. Every
 * future Admin page (Categories, Brands, Suppliers, etc.) should build on
 * these instead of redefining the same colors/spacing inline again.
 */

export const colors = {
  ink: "#0F172A",
  slate: "#64748B",
  slateLight: "#94A3B8",
  border: "#E2E8F0",
  bg: "#F8FAFC",
  headerBg: "#F1F5F9",
  navy: "#1E293B",
  success: "#059669",
  successBg: "#ECFDF5",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  warn: "#92400E",
  warnBg: "#FFFBEB",
  warnBorder: "#FCD34D",
  info: "#2563EB",
  infoBg: "#EFF6FF",
};

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: colors.ink, marginBottom: 4 }}>{title}</h1>
        {description && <p style={{ fontSize: 13, color: colors.slate, maxWidth: 640 }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: colors.ink, color: "#fff", border: "none" },
    secondary: { background: "#fff", color: colors.ink, border: `1px solid ${colors.border}` },
    danger: { background: colors.danger, color: "#fff", border: "none" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 16px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontSize: 13,
          color: colors.ink,
        }}
      />
      {error && <p style={{ fontSize: 12, color: colors.danger, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export function Textarea({ value, onChange, rows = 3, error }: { value: string; onChange: (v: string) => void; rows?: number; error?: string }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontSize: 13,
          color: colors.ink,
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />
      {error && <p style={{ fontSize: 12, color: colors.danger, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontSize: 13,
          color: colors.ink,
          background: "#fff",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p style={{ fontSize: 12, color: colors.danger, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: colors.ink, marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

const BADGE_TONES: Record<string, { fg: string; bg: string }> = {
  VERIFIED: { fg: colors.success, bg: colors.successBg },
  NEEDS_REVIEW: { fg: colors.warn, bg: colors.warnBg },
  STALE: { fg: colors.danger, bg: colors.dangerBg },
  QUOTE_ONLY: { fg: colors.slate, bg: colors.headerBg },
  IN_STOCK: { fg: colors.success, bg: colors.successBg },
  LOW_STOCK: { fg: colors.warn, bg: colors.warnBg },
  OUT_OF_STOCK: { fg: colors.danger, bg: colors.dangerBg },
  ORDER_REQUIRED: { fg: colors.info, bg: colors.infoBg },
  DISCONTINUED: { fg: colors.slate, bg: colors.headerBg },
  UNKNOWN: { fg: colors.slate, bg: colors.headerBg },
  DRAFT: { fg: colors.slate, bg: colors.headerBg },
  PUBLISHED: { fg: colors.success, bg: colors.successBg },
  ARCHIVED: { fg: colors.danger, bg: colors.dangerBg },
};

export function Badge({ value }: { value: string }) {
  const tone = BADGE_TONES[value] ?? { fg: colors.slate, bg: colors.headerBg };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: tone.fg,
        background: tone.bg,
        whiteSpace: "nowrap",
      }}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function Table({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: colors.headerBg, textAlign: "left" }}>
            {columns.map((c) => (
              <th key={c} style={{ padding: "10px 14px", fontWeight: 600, color: "#334155" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "28px 14px", textAlign: "center", color: colors.slateLight, fontSize: 13 }}>
        {children}
      </td>
    </tr>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${colors.danger}`,
        background: colors.dangerBg,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        color: colors.danger,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${colors.success}`,
        background: colors.successBg,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        color: colors.success,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 10,
          width: "100%",
          maxWidth: wide ? 640 : 460,
          padding: 24,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.ink }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, color: colors.slate, cursor: "pointer", lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  danger,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ fontSize: 13, color: colors.slate, marginBottom: 20 }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Spinner() {
  return <div style={{ padding: "40px 0", textAlign: "center", color: colors.slateLight, fontSize: 13 }}>Loading…</div>;
}
