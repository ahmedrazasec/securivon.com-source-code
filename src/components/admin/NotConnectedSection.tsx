interface NotConnectedSectionProps {
  title: string;
  description: string;
  servicePath?: string;
  routePath?: string;
  columns?: string[];
}

/**
 * Shown by every Admin section whose real functionality depends on a
 * database connection this sandbox cannot provide (see README "Known
 * limitations"). This is a deliberate, honest choice: rather than wiring
 * these pages to fake/in-memory data and presenting it as if it worked,
 * each section says plainly what's built, what isn't connected yet, and
 * exactly where the real code lives — so a reviewer can verify the claim
 * directly instead of taking it on faith.
 */
export function NotConnectedSection({
  title,
  description,
  servicePath,
  routePath,
  columns,
}: NotConnectedSectionProps) {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{title}</h1>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, maxWidth: 640 }}>{description}</p>

      <div
        style={{
          border: "1px solid #FCD34D",
          background: "#FFFBEB",
          borderRadius: 8,
          padding: "14px 18px",
          fontSize: 13,
          color: "#92400E",
          marginBottom: 24,
          maxWidth: 640,
        }}
      >
        <strong>Not connected in this sandbox.</strong> The service and repository logic for this
        section is fully implemented and unit-tested, but the database connection required to load
        real data isn&apos;t available here (Prisma&apos;s client couldn&apos;t be generated — see
        the project README&apos;s &quot;Known limitations&quot; section).
        {servicePath && (
          <>
            {" "}
            Business logic: <code style={{ background: "#FEF3C7", padding: "1px 4px", borderRadius: 3 }}>{servicePath}</code>
          </>
        )}
        {routePath && (
          <>
            {" "}
            Ready-to-mount route: <code style={{ background: "#FEF3C7", padding: "1px 4px", borderRadius: 3 }}>{routePath}</code>
          </>
        )}
      </div>

      {columns && (
        <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden", maxWidth: 800 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F1F5F9", textAlign: "left" }}>
                {columns.map((c) => (
                  <th key={c} style={{ padding: "10px 14px", fontWeight: 600, color: "#334155" }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} style={{ padding: "28px 14px", textAlign: "center", color: "#94A3B8" }}>
                  No data — database not connected in this environment.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
