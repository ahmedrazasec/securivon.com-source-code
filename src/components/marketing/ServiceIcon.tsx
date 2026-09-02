/**
 * Small line-icon set for service pages. Keyed to the actual service slugs
 * used across the site (see src/components/marketing/CoreSolutions.tsx) —
 * not generic decoration. Falls back to a shield icon for any slug outside
 * this set so a newly-added service never renders broken.
 *
 * Deliberately simple/geometric, matching the black/white + restrained
 * accent identity — no gradients, no photographic icon packs.
 */

import type { ComponentType } from "react";

type IconProps = { className?: string };

function CameraIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="14" cy="17" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M23 14.5L27 12v10l-4-2.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function WrenchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 7a5 5 0 0 0-6.9 5.9L6 21l3 3 8.1-8.1A5 5 0 0 0 23 9l-3.5 3.5-2-2L21 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FingerprintIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M16 9a7 7 0 0 1 7 7v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 9a7 7 0 0 0-7 7v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 22v-6a4 4 0 1 1 8 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 23v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 6c1 3-3 4-3 8a3 3 0 0 0 6 0c1.5 1 2 2.7 2 4.2A5.2 5.2 0 0 1 15.8 23 5.5 5.5 0 0 1 10 17.6c0-4 3-6.4 6-11.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IntercomIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="6" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13 18h6M13 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function AlarmIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M16 8a8 8 0 0 1 8 8v3l2 3H6l2-3v-3a8 8 0 0 1 8-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13.5 25a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function NetworkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="24" r="2.3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="24" cy="24" r="2.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 10.3V16M16 16 9.5 22M16 16l6.5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MaintenanceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M16 8v3M16 21v3M8 16h3M21 16h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M16 6l9 3.3v6.4c0 6-4 9.6-9 11-5-1.4-9-5-9-11V9.3L16 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

const SERVICE_ICONS: Record<string, ComponentType<IconProps>> = {
  "cctv-installation": CameraIcon,
  "cctv-repair-maintenance": WrenchIcon,
  "access-control": FingerprintIcon,
  "fire-alarm": FlameIcon,
  "video-intercom": IntercomIcon,
  "intrusion-security": AlarmIcon,
  networking: NetworkIcon,
  "maintenance-amc": MaintenanceIcon,
};

export function ServiceIcon({ slug, className = "h-6 w-6" }: { slug: string; className?: string }) {
  const Icon = SERVICE_ICONS[slug] ?? ShieldIcon;
  return <Icon className={className} />;
}
