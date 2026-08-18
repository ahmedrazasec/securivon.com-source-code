/**
 * Placeholder root page — foundation stage only.
 *
 * The real homepage (Phase 3 spec, ported from the approved prototype) is
 * explicitly NOT part of this foundation stage per your instructions. This
 * placeholder exists only so `next build` has a valid root route while the
 * project scaffold is being established.
 */
export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "120px auto", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Securivon — Production Foundation</h1>
      <p style={{ fontSize: 14, color: "#666" }}>
        This is a scaffolding placeholder. The real homepage has not been built yet — see the
        development roadmap in the project README.
      </p>
    </main>
  );
}
