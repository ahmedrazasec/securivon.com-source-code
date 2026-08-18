# src/components

Not built out yet — deliberately, per the Phase 4 Stage 1 scope ("do not yet
build full homepage / catalogue / packages / configurator UI / service pages
/ production quote UI").

When UI development begins (a later development stage, not this one), this
directory should hold the production port of the approved prototype's design
system and component inventory:

- `ui/` — base primitives (Button, Badge, PriceDisplay, Card, etc.) —
  see Phase 3 §J/§K for the full component inventory and design tokens.
- `layout/` — Header, MobileNav drawer, Footer, FloatingWhatsApp.
- `configurator/` — the 8-step configurator's step components, ported from
  `securivon-prototype.jsx`'s `Configurator`/`ChoiceCard`/`StepShell`, wired
  to real server APIs instead of the prototype's local demo state.

Do not port prototype pricing/storage arithmetic into any of these — that
logic lives server-side only, in `src/server/pricing` and `src/server/storage`.
