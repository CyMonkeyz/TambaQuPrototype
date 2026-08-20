# TambaQu Design System — Phase 1

## Principles

TambaQu should feel professional, scientific, calm, approachable, and usable in the field. Information hierarchy follows condition → risk → reason → action. The UI avoids financial-dashboard visual language, excessive gradients, glass effects, and decoration that competes with operational information.

## Tokens

Semantic CSS variables live in `src/styles/global.css` and are exposed to Tailwind where useful:

- `background`, `surface`, `surface-muted`
- `foreground`, `foreground-muted`, `border`
- `primary`, `primary-hover`, `primary-foreground`, `ring`
- `risk-safe`, `risk-warning`, `risk-critical` plus quiet backgrounds
- `status-online`, `status-offline`, `status-degraded`
- `shadow-card`

Components consume semantic names rather than repeating raw colors. Risk and connection status use separate namespaces because operational status is not risk.

## Typography

The stack uses one system sans-serif family for fast, dependable rendering. Headings use compact negative tracking and moderate weight. Sensor values use larger tabular-friendly figures with visibly subordinate units. Body copy stays between 14–16px with generous line height; headings remain restrained on mobile.

## Spacing and shape

The base spacing rhythm is 4px. Primary touch targets are at least 44px. Cards use 16px corner radii; controls generally use 12px. Page gutters are 20px on small screens and 32px on desktop. Layouts use gaps instead of tightly packed dividers.

## Risk semantics

- **Aman**: green, check icon, and explicit text label; score 0–39.
- **Waspada**: amber, warning triangle, and explicit text label; score 40–69.
- **Kritis**: red, octagonal alert icon, and explicit text label; score 70–100.

Color is never the only carrier of risk meaning. Labels and icons remain present in badges and summaries. Wording describes indication and level of risk, never certainty or automatic diagnosis.

## Components

The foundation includes AppLogo, Button, IconButton, Card, Badge, StatusBadge, RiskBadge, StatusDot, MetricCard, SectionHeader, PageHeader, EmptyState, ErrorState, LoadingSkeleton, Avatar, Divider, Tooltip, Dialog, and Toast. Domain presentation includes PondCard, SensorMetric, DeviceStatus, and RiskSummary.

## Responsive philosophy

The product is mobile-first without shrinking a desktop dashboard. Below 1024px, a five-item bottom navigation presents Home, Ponds, PondBrain, Alerts, and More; More opens the secondary routes. At 1024px and above, a compact collapsible sidebar exposes all destinations. Grids collapse progressively at content-driven breakpoints, cards permit wrapping, and the root prevents accidental horizontal overflow. The intended validation widths are 360, 390, 430, 768, 1024, 1280, and 1440px.
