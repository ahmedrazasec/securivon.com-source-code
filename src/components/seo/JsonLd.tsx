/**
 * Renders a single JSON-LD <script type="application/ld+json"> tag.
 *
 * JSON.stringify + a manual `<`→`\u003c` escape (not dangerouslySetInnerHTML
 * with raw interpolation) so nothing in the data — e.g. a product name
 * containing "</script>" — can break out of the script tag. All callers
 * pass plain data objects assembled from already public-safe, allowlisted
 * fields (see each JSON-LD builder's own file for the specific source).
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
