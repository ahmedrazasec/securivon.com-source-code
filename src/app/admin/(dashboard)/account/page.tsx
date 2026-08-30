"use client";

import { useState } from "react";
import { PageHeader, Button, Input, Field, ErrorBanner, SuccessBanner, colors } from "@/components/admin/ui";

/**
 * Admin "My Account" page — currently just self-service password change.
 *
 * Deliberately scoped to the signed-in admin's own credential. Managing
 * other AdminUser rows (creating accounts, resetting someone else's
 * password, roles/active status) is a separate, larger feature and out of
 * scope here — see src/server/adminRoutes/account.ts.
 */
export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not change password.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="My Account" description="Change the password for your own admin login." />

      {success && <SuccessBanner>Password changed successfully.</SuccessBanner>}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div style={{ maxWidth: 360, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 8, padding: 20 }}>
        <Field label="Current password">
          <Input type="password" value={currentPassword} onChange={setCurrentPassword} />
        </Field>
        <Field label="New password">
          <Input type="password" value={newPassword} onChange={setNewPassword} />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={confirmPassword} onChange={setConfirmPassword} />
        </Field>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
        >
          {saving ? "Saving…" : "Change password"}
        </Button>
      </div>
    </div>
  );
}
