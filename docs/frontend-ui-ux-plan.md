# Front-End UI/UX Plan

## Diagnosis

Right now the product feels visually flat because too many surfaces use the same treatment:

- the same dark panel style repeats for stats, search, lists, and detail content
- the same pill pattern appears in global nav, filters, and status chips
- the same button styling carries both primary actions and routine utility actions
- the same card rhythm is used for dashboard overview, lead triage, invoices, and client records

The result is functional, but the interface does not clearly express priority. Everything looks equally important, so the user has to read too much before deciding what to do.

## Visual Thesis

Build the admin like a calm service desk, not a marketing page:

- one quiet workspace background
- one strong accent color for action and urgency
- fewer cards, more layout
- tighter utility copy
- stronger contrast between queue work, summary metrics, and deep record editing

For the public site, keep the current brand tone but introduce more section contrast so each block has a distinct job instead of repeating the same dark-panel feeling.

## Primary UX Goals

1. Reduce time to first action on the admin dashboard.
2. Make urgent work visually obvious without reading every block.
3. Separate summary, triage, and record-management surfaces.
4. Give the site and admin different personalities while keeping the same brand system.

## Admin Redesign Plan

### 1. Dashboard hierarchy

Replace the current KPI-first mosaic with a workflow-first layout:

- top utility bar: search, filters, export
- primary work queue: new leads and open invoices
- secondary summary: compact metrics row
- client list: dense operational list below

Why:

- leads and unpaid work are the actions that matter most
- metrics support decisions, but they should not dominate the first screen

### 2. Surface system

Reduce repeated card styling by defining three surface types:

- utility surface: flat or near-flat, for search, filters, and top actions
- queue surface: slightly elevated, for leads and invoices that need action
- record surface: dense, information-heavy layout for client rows and detail pages

Rules:

- do not use the premium gradient panel everywhere
- reserve stronger contrast for urgent states only
- use borders and spacing before adding more background effects

### 3. Navigation

Move the admin toward a clearer application shell:

- global header for brand, password, export, sign out
- local page controls under the header
- active nav state on every page
- one primary action per page, not duplicated in multiple places

Future option:

- switch from pill navigation to a simpler segmented utility bar or left rail if the CRM grows beyond 4 to 5 destinations

### 4. Dashboard content blocks

Restructure the homepage into these sections:

- `Needs attention`
  - new leads
  - open invoices
  - overdue follow-ups
- `Search clients`
  - persistent search and filters
- `Clients`
  - compact list with quick actions
- `Snapshot`
  - smaller metrics row with tabular numbers

This gives the page one primary job: triage and act.

### 5. Client list redesign

Shift from wide dashboard cards to denser operational rows:

- client name and status on the left
- phone, city, and email on one metadata line
- counts and latest service in a compact right column
- action buttons grouped tightly at row end

Improvements:

- less vertical scroll
- easier scanning across many clients
- clearer distinction between list view and detail view

### 6. Client detail page redesign

The client detail page should become the real workspace:

- header with client identity, status, phone CTA, and quick edit actions
- left main column for service timeline and notes
- right side inspector for contact info, equipment, unpaid balance, and follow-up date
- sticky action cluster for `Call`, `Add service`, `Add note`, `Edit client`

The page should feel different from the dashboard: less summary, more active record management.

### 7. State and urgency language

Create clearer visual rules for status:

- `lead`: brighter accent, subtle highlight
- `active`: neutral, low emphasis
- `open invoice`: warm warning tone
- `paid`: quiet success tone
- `follow-up due`: outlined warning state

Use color sparingly. The point is faster scanning, not decoration.

### 8. Typography and spacing

Tighten the system:

- large display type only for page titles and key counts
- smaller, consistent labels for metrics and metadata
- more compact spacing in the client list
- larger spacing only around top-level sections

This avoids the current effect where every block feels like a hero block.

### 9. Motion and interaction

Keep motion minimal and useful:

- soft section fade on page load
- subtle hover lift only on interactive cards or rows
- fast active-state transitions for filters and tabs
- no decorative motion on routine admin surfaces

### 10. Mobile admin behavior

Improve mobile ergonomics:

- sticky top action bar with search and add-client CTA
- one-column stacked queue items
- full-width call and open-client actions
- denser client rows collapsed into two logical groups instead of four small stat columns

The mobile admin should feel like a field tool, not a shrunk desktop dashboard.

## Public Site Redesign Plan

### 1. Give each section one job

Current risk:

- sections share similar mood, contrast, and panel treatment

Target:

- hero: trust and service area
- services: what they do
- proof: credibility and reassurance
- contact: immediate action

### 2. Stronger section contrast

Use more variation between sections:

- one image-led section
- one text-led section
- one proof or testimonial section
- one conversion section with simpler background treatment

This prevents the page from feeling like one long version of the same block.

### 3. Brand system

Keep the existing dark/cool palette, but tighten how it is used:

- blue accent for interaction
- off-white for premium contrast
- neutral steel copy for secondary content
- limit gradients to hero and key brand moments

### 4. CTA strategy

Clarify CTA hierarchy:

- one primary CTA per screen
- phone CTA persistent on mobile
- secondary CTA only where it supports the main decision

## Implementation Roadmap

### Phase 1: Utility cleanup

- remove duplicated actions
- improve active states and list density
- convert dashboard from card-heavy to workflow-first
- tighten copy and spacing

### Phase 2: Client workspace

- redesign client detail page
- introduce inspector layout
- improve service timeline and notes composition

### Phase 3: Public site polish

- increase section contrast
- strengthen storytelling and trust blocks
- refine CTA hierarchy and mobile flow

## Success Metrics

The redesign is working if:

- the owner can identify the next action without reading the full page
- the dashboard shows urgency in under 3 seconds
- client management requires less scrolling
- the public site feels more intentional and less repetitive section to section

## Immediate Next Build Recommendation

If we start the visual redesign now, the highest-value first implementation is:

1. Rebuild the admin dashboard into `Needs attention`, `Search`, and `Clients`.
2. Replace client cards with denser list rows.
3. Redesign the client detail page as the main operating workspace.
