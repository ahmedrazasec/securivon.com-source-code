import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Shared PUBLIC-facing design primitives (Button, Card, Badge).
 *
 * Extracted from the inline `rounded-md bg-ink px-6 py-3 text-sm font-semibold
 * text-paper transition-colors hover:bg-accent-strong` (and similar) strings
 * that were duplicated across every public page — see design audit. Existing
 * pages weren't broken, so this is a mechanical extraction: same visual
 * output, one definition. Admin keeps its own separate `@/components/admin/ui`
 * (inline-style system) — deliberately not touched or unified with this,
 * per the "public first, don't redesign admin" constraint.
 *
 * These are additive: existing pages don't have to migrate immediately, but
 * new/touched public pages should use these instead of re-writing the class
 * strings again.
 */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants = {
  primary: "bg-ink text-paper hover:bg-accent-strong",
  secondary: "border border-line bg-paper-raised text-ink hover:border-accent",
  ghost: "text-ink underline decoration-line underline-offset-4 hover:decoration-ink",
} as const;

const buttonSizes = {
  md: "px-4 py-2.5",
  lg: "px-6 py-3",
} as const;

type ButtonVariant = keyof typeof buttonVariants;
type ButtonSize = keyof typeof buttonSizes;

/** Renders a <Link> when `href` is a same-origin path, an <a> for external links, or a <button> otherwise. */
export function Button({
  href,
  external,
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...rest
}: {
  href?: string;
  external?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel">) {
  const classes = `${buttonBase} ${buttonVariants[variant]} ${variant === "ghost" ? "" : buttonSizes[size]} ${className}`;

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

/** Standard bordered surface used for cards, panels, and grouped info blocks. */
export function Card({
  children,
  className = "",
  as: Component = "div",
  href,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  href?: string;
  interactive?: boolean;
}) {
  const classes = `rounded-lg border border-line bg-paper-raised ${
    interactive || href ? "transition-colors hover:border-accent" : ""
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={`group block ${classes}`}>
        {children}
      </Link>
    );
  }
  return <Component className={classes}>{children}</Component>;
}

const badgeTones = {
  neutral: "border-line bg-paper text-slate",
  warn: "border-warn/30 bg-warn/10 text-warn",
  accent: "border-accent/30 bg-accent-soft text-accent-strong",
} as const;

/** Small pill label — availability, warranty duration, category tags, etc. */
export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
