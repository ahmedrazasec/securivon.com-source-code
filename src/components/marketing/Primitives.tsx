import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">{eyebrow}</p>
      )}
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-relaxed text-slate">{description}</p>}
    </div>
  );
}
