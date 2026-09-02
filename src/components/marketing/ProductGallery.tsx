"use client";

import { useState } from "react";

/**
 * Product detail image gallery — main image + thumbnail strip when a
 * product has more than one image. Isolated as its own small client
 * component (rather than making the whole product detail page client-side)
 * so the page itself stays a Server Component and keeps its
 * generateMetadata/data-fetching as-is.
 */
export function ProductGallery({
  images,
  fallbackAlt,
}: {
  images: Array<{ url: string; alt?: string }>;
  fallbackAlt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-raised">
        <ProductPlaceholderIcon />
      </div>
    );
  }

  return (
    <div>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-raised">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered image source, arbitrary host */}
        <img src={active.url} alt={active.alt ?? fallbackAlt} className="h-full w-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((image, i) => (
            <button
              key={image.url + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-pressed={i === activeIndex}
              className={`h-16 w-16 overflow-hidden rounded-md border transition-colors ${
                i === activeIndex ? "border-accent" : "border-line hover:border-accent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered image source, arbitrary host */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-14 w-14 text-line" aria-hidden="true">
      <rect x="6" y="14" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="26" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M17 14L20 9H28L31 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
