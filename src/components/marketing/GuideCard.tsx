import type { PublicGuideListing } from "@/server/publicRoutes/guideCatalogue";
import { Card } from "@/components/marketing/ui";

export function GuideCard({ guide }: { guide: PublicGuideListing }) {
  const image = guide.images[0];

  return (
    <Card href={`/guides/${guide.slug}`} className="flex flex-col overflow-hidden p-0">
      <div className="flex aspect-[16/9] items-center justify-center border-b border-line bg-paper">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-entered image source, arbitrary host
          <img
            src={image.url}
            alt={image.alt ?? guide.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <GuidePlaceholderIcon />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-ink group-hover:text-accent-strong">{guide.title}</h3>
        {guide.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">{guide.excerpt}</p>}

        <div className="mt-4 flex flex-1 items-end justify-between gap-3 border-t border-line pt-4 text-xs text-slate">
          <span>
            {guide.readingTimeMinutes} min read
          </span>
          <span className="shrink-0 text-xs font-semibold text-accent-strong">Read guide →</span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Open-book motif — grounded in "this is a guide/reference," not generic
 * decoration. Matches the geometric, monochrome style of the other
 * catalogue placeholder icons (ProductCard/PackageCard).
 */
function GuidePlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 text-line" aria-hidden="true">
      <path d="M24 14c-3-2.5-7.5-3-12-2v22c4.5-1 9 -0.5 12 2 3-2.5 7.5-3 12-2V12c-4.5-1-9-0.5-12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 14v22" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
