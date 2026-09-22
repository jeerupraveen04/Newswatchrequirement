# 03 — Page Documentation Template

Copy this template for every new page doc in `docs/pages/`. Remove the guidance
comments when filling in. Keep all sections, even if "N/A".

---

# <PAGE ID> — <Page Name>

## Metadata

| Field | Value |
|---|---|
| Page ID | P00 |
| Platforms | Mobile / Web |
| Roles | Guest / Reader / Reporter / Admin |
| Priority | P0 |
| Route / Path | `/example` |
| Prototype | `prototypes/web/example.html` |

## Purpose

One paragraph describing why this page exists and the value it delivers.

## UI Structure

### Mobile
- Region-by-region layout (header, body, footer).
- Component list with token references.

### Web
- Region-by-region layout.
- Differences from mobile.

### Responsive behavior
- Breakpoints and how layout adapts.

## Features / Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-XXX-001 | The page MUST ... | P0 |

## User Interactions

- Tap/click behaviours.
- Gestures (swipe, pull-to-refresh, long-press).
- Animations/transitions and their timing.

## Validation & Error States

| Field/Action | Rule | Error message |
|---|---|---|
| Email | Valid email, required | "Enter a valid email address" |

## Loading, Empty, Success States

- **Loading:** skeleton/spinner description.
- **Empty:** illustration + message + CTA.
- **Success:** what the user sees/gets.

## User Flow

1. User arrives from ...
2. User does ...
3. System responds ...
4. Ends at ...

(Optional Mermaid diagram.)

## Dependencies

- Screens: ...
- Components: ...
- Services/stores: ...
- Backend endpoints: ...

## API / Data Requirements

| Method | Endpoint | Purpose |
|---|---|---|

Request/response examples.

## Navigation

| Action | From | To |
|---|---|---|

## Analytics Events

| Event | Trigger | Properties |
|---|---|---|

## Open Questions

- ...
