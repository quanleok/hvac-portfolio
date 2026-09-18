# SMS Notifications + Admin-Managed Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two client-requested features on doubleleheatandair.com: (1) send an SMS to the owner's phone every time the contact form is submitted, in addition to the existing email + Supabase CRM entry, and (2) build an admin-managed media system so the owner can upload photos/videos from the field and have them appear on the public site (replaceable single-item slots on the landing page + auto-scrolling companion strips beneath existing sections + a dedicated `/gallery` page with four categories — People, Work, Location, Reviews). The owner can configure per-section layout and scroll style.

**Architecture:**
- **SMS**: Additive — the Twilio HTTP API is invoked from `app/api/contact/route.ts` after the Resend email, using the same `trial` account that the client already created. Failure of SMS does not fail the form submission. Env-driven so SMS is silently skipped when unconfigured.
- **Media**: Supabase (already in the stack) handles both data and files. Three new tables (`media_sections`, `media`, `media_assignments`) plus one new public Storage bucket (`site-media`). Server components query assigned media at render time; when a section has no published assignments the hardcoded seed (existing `/public/media/*` file or existing JSX) renders as a fallback, so the site always looks complete. Server actions handle upload/edit/delete and use the service-role client. CSS-only marquee/grid/carousel rendering keeps everything static-friendly.

**Tech Stack:** Next.js 16.2 App Router (server components first), React 19, Supabase (Postgres + Storage + SSR auth), Resend (existing), Twilio (new, HTTP only — no SDK), Tailwind v4. No new test framework; verification is runtime: `curl` the API, visit the dev server, inspect Supabase rows.

---

## Background for the implementer

You likely have no context for this codebase. Read these before touching code:
- `app/api/contact/route.ts` — existing contact flow (validates → inserts Supabase `clients`+`notes` → emails via Resend). You will add a Twilio call near the bottom.
- `lib/supabase/admin.ts` + `lib/supabase/server.ts` + `lib/supabase/config.ts` — existing Supabase clients. Use these; do not create new ones.
- `lib/admin/auth.ts` — `requireAdminSession()` gates every admin page/server action.
- `app/admin/actions.ts` — existing server action patterns. Copy the `getVerifiedSupabaseClient` → `ActionResult` → `revalidatePath` rhythm for our new actions.
- `supabase/migrations/20260407_client_management.sql` — existing migration conventions (RLS: `auth.role() = 'authenticated'` for full access; `set_updated_at` trigger).
- `components/admin/admin-nav.tsx` — where to add the "Media" tab.
- `components/site-shell.tsx` — where to add the "Gallery" link.

**Dev server:** `npm run dev` runs on port 3000 by default. All curl/verification steps assume that.

**Git:** The project directory IS a git repo. Run git commands from inside `.`.

**Supabase:** The project is linked (`.vercel` dir exists, `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` etc). Migrations are applied manually via the Supabase SQL editor or `supabase db push` — this project does not appear to use `supabase db reset`, so do not assume local Supabase CLI. Always apply migrations by copy-paste into the Supabase dashboard SQL editor unless told otherwise.

**Types:** `lib/supabase/database.types.ts` is hand-maintained (not auto-regenerated each migration). After each migration, you must add corresponding table types to that file manually (shown in each DB task).

---

## File Structure

**Created:**
- `lib/notifications/sms.ts` — single exported `sendSms()` helper around Twilio's REST API.
- `lib/media/schema.ts` — section constants, enums, and typed section definitions (seeds, titles, kinds).
- `lib/media/data.ts` — read functions for public site (server-side queries, fallback logic).
- `lib/media/storage.ts` — path helpers and `site-media` bucket constants.
- `lib/media/url.ts` — resolves a Supabase Storage path to a public URL.
- `app/admin/(protected)/media/page.tsx` — admin media dashboard (list of sections + recent uploads).
- `app/admin/(protected)/media/[sectionId]/page.tsx` — per-section view: config + reorderable items.
- `app/admin/(protected)/media/actions.ts` — server actions (upload, update, delete, reorder, set-config).
- `components/admin/media-upload-form.tsx` — the upload form (client component with file input).
- `components/admin/media-edit-form.tsx` — edit caption/alt/sections for an existing item.
- `components/admin/section-settings-form.tsx` — per-section layout/scroll controls.
- `components/admin/media-reorder-list.tsx` — up/down buttons for ordering within a section.
- `components/media/single-media-slot.tsx` — public server component: renders the one published item for a single-kind section, or falls through to seed.
- `components/media/media-strip.tsx` — public server component: renders a strip with the section's chosen layout.
- `components/media/media-strip.css.ts` — (NOT a file — inline class name helper; actual styles live in `app/globals.css`).
- `app/gallery/page.tsx` — public Gallery page (four categories, anchor nav).
- `supabase/migrations/20260417_media_management.sql` — new migration (tables, policies, triggers, seed rows).
- `supabase/migrations/20260417_media_storage_bucket.sql` — Storage bucket + RLS policies (applied in dashboard).

**Modified:**
- `.env.example` — add Twilio + already-present Supabase vars noted.
- `.env.local` — engineer adds actual Twilio + SMS recipient values locally.
- `app/api/contact/route.ts` — invoke `sendSms()` after the Resend step.
- `next.config.ts` — add Supabase Storage remotePatterns + bump `serverActions.bodySizeLimit` for video uploads.
- `lib/supabase/database.types.ts` — append `media`, `media_sections`, `media_assignments` typings.
- `components/admin/admin-nav.tsx` — add "Media" nav entry.
- `components/site-shell.tsx` — add "Gallery" nav entry (desktop nav + footer nav).
- `app/page.tsx` — swap hardcoded single-item slots to `<SingleMediaSlot>` and insert `<MediaStrip>` under relevant sections.
- `app/globals.css` — add `.media-marquee`, `.media-grid`, `.media-carousel` styles.

**Not touched:** any testimonial / promo / service detail page. Keep scope tight.

---

## Phase 1 — SMS notification (tasks 1–4)

### Task 1: Add Twilio environment variables

**Files:**
- Modify: `./.env.example`
- Modify: `./.env.local` (local only — do NOT commit)

- [ ] **Step 1: Verify the failing state**

Run:
```bash
cd .
grep -i twilio .env.example || echo "MISSING"
```
Expected: `MISSING`.

- [ ] **Step 2: Append Twilio vars to `.env.example`**

Open `.env.example` and append:
```
# Twilio SMS notifications (optional — set to enable SMS alerts on contact form submits)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+18555130259
CONTACT_SMS_TO=
```

- [ ] **Step 3: Add real values to `.env.local`**

Open `.env.local` and append (use the real Account SID and Auth Token from the Twilio console, and the owner's verified cell number in E.164 format — e.g. `+14053615014`):
```
TWILIO_ACCOUNT_SID=ACe5820c23bb7566a2670a929dc0480cb3
TWILIO_AUTH_TOKEN=<paste-the-real-token-here>
TWILIO_FROM_NUMBER=+18555130259
CONTACT_SMS_TO=+1XXXXXXXXXX
```

> Important: Twilio trial accounts can only send SMS to **verified caller IDs**. Before the first end-to-end test, the owner must add his cell to **Twilio Console → Phone Numbers → Verified Caller IDs** and complete the verification code. Without that, Twilio returns HTTP 400 "unverified number".

- [ ] **Step 4: Verify the success state**

Run:
```bash
grep -c "^TWILIO_" .env.example
grep -c "^TWILIO_" .env.local
grep -c "^CONTACT_SMS_TO=" .env.local
```
Expected: `3` for `.env.example`, `3` for `.env.local`, `1` for `CONTACT_SMS_TO`.

- [ ] **Step 5: Commit**

```bash
cd .
git add .env.example
git commit -m "chore: document Twilio SMS env vars"
```
(Note: `.env.local` is gitignored — do not add it.)

---

### Task 2: Create the SMS helper

**Files:**
- Create: `./lib/notifications/sms.ts`

- [ ] **Step 1: Write the failing verification**

Run:
```bash
test -f lib/notifications/sms.ts && echo EXISTS || echo MISSING
```
Expected: `MISSING`.

- [ ] **Step 2: Create the helper**

Create `lib/notifications/sms.ts` with:
```ts
interface SendSmsInput {
  body: string;
  to?: string;
}

interface SendSmsResult {
  sent: boolean;
  skipped?: "unconfigured" | "no-recipient";
  error?: string;
}

export async function sendSms({ body, to }: SendSmsInput): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
  const recipient = (to ?? process.env.CONTACT_SMS_TO)?.trim();

  if (!accountSid || !authToken || !fromNumber) {
    return { sent: false, skipped: "unconfigured" };
  }

  if (!recipient) {
    return { sent: false, skipped: "no-recipient" };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.set("From", fromNumber);
  params.set("To", recipient);
  params.set("Body", body);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        sent: false,
        error: `Twilio ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown Twilio error",
    };
  }
}
```

- [ ] **Step 3: Confirm it compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0, no errors.

- [ ] **Step 4: Quick smoke test from a throwaway Node script**

Create `/tmp/sms-smoke.ts`:
```ts
import { sendSms } from "./lib/notifications/sms";
// This path will not work directly — use the import mechanism built into Next. Skip if you don't have a quick runner.
```

(In practice: skip the standalone Node test — it is easier to verify via the full contact-form flow in Task 4. Move on.)

- [ ] **Step 5: Commit**

```bash
git add lib/notifications/sms.ts
git commit -m "feat: add Twilio SMS notification helper"
```

---

### Task 3: Wire SMS into the contact route

**Files:**
- Modify: `./app/api/contact/route.ts`

- [ ] **Step 1: Read the existing route**

Open `app/api/contact/route.ts`. Identify the block that starts around line 130 (`let emailSent = false;`). The SMS call will go after the Resend block, before the `emailSent && leadCaptured` fallthrough at line 157.

- [ ] **Step 2: Add the import at the top of the file**

After the `import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";` line, add:
```ts
import { sendSms } from "@/lib/notifications/sms";
```

- [ ] **Step 3: Add the SMS dispatch block**

After the `if (!response.ok) { ... } else { emailSent = true; }` closing block of the Resend call, BEFORE the `if (!emailSent && !leadCaptured)` check, insert:

```ts
  const smsBody = [
    `DL HVAC lead:`,
    `${name} · ${phone}`,
    city ? `City: ${city}` : null,
    email ? `Email: ${email}` : null,
    "",
    message.length > 180 ? `${message.slice(0, 177)}...` : message,
  ]
    .filter(Boolean)
    .join("\n");

  const smsResult = await sendSms({ body: smsBody });
  if (!smsResult.sent && smsResult.error) {
    console.error("[contact] twilio error:", smsResult.error);
  }
```

- [ ] **Step 4: Verify the file compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/api/contact/route.ts
git commit -m "feat: send SMS notification on contact form submissions"
```

---

### Task 4: End-to-end SMS verification

**Files:** none modified.

- [ ] **Step 1: Confirm Twilio verified-caller-ID is in place**

In the Twilio console, navigate to **Phone Numbers → Verified Caller IDs**. Confirm the owner's cell listed in `CONTACT_SMS_TO` is present and status is **Verified**. If not, add it and wait for the verification SMS before continuing.

- [ ] **Step 2: Start dev server**

Run:
```bash
cd .
npm run dev
```
Expected output includes: `Ready in XXX ms` and `Local: http://localhost:3000`.

- [ ] **Step 3: Submit a test contact via curl**

In a second terminal:
```bash
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plan Test",
    "phone": "405-555-0101",
    "email": "test@example.com",
    "city": "OKC",
    "message": "SMS wiring verification — please ignore."
  }'
```
Expected: `{"success":true}`.

- [ ] **Step 4: Verify SMS arrived on the owner's phone**

Check the owner's cell. An SMS should arrive within ~30 seconds reading:
```
DL HVAC lead:
Plan Test · 405-555-0101
City: OKC
Email: test@example.com

SMS wiring verification — please ignore.
```

- [ ] **Step 5: Verify CRM row and email still work**

- Email: check the inbox for `CONTACT_RECIPIENT_EMAIL`.
- CRM: open the admin dashboard at `http://localhost:3000/admin`, confirm a new client `Plan Test` exists with `status=lead`.

- [ ] **Step 6: Kill the dev server**

Ctrl-C in the dev-server terminal.

- [ ] **Step 7: No commit needed — this is a verification task.**

---

## Phase 2 — Database foundation (tasks 5–8)

### Task 5: Write the media migration SQL

**Files:**
- Create: `./supabase/migrations/20260417_media_management.sql`

- [ ] **Step 1: Write the migration file**

Create the file with exactly this content:

```sql
create extension if not exists pgcrypto;

-- 1. media_sections: one row per "slot" on the site. Pre-seeded; admin edits config only.
create table if not exists public.media_sections (
  id text primary key,
  title text not null,
  kind text not null check (kind in ('single', 'strip')),
  enabled boolean not null default true,
  layout text not null default 'marquee' check (layout in ('marquee', 'grid', 'carousel')),
  scroll_direction text not null default 'left' check (scroll_direction in ('left', 'right')),
  scroll_speed text not null default 'medium' check (scroll_speed in ('slow', 'medium', 'fast')),
  items_visible int not null default 4 check (items_visible between 2 and 6),
  show_captions boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. media: one row per uploaded asset.
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video')),
  storage_path text not null,
  caption text,
  alt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. media_assignments: join table. One media can be in many sections.
create table if not exists public.media_assignments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete cascade,
  section_id text not null references public.media_sections(id) on delete cascade,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_id, section_id)
);

create index if not exists idx_media_created on public.media (created_at desc);
create index if not exists idx_media_assignments_section on public.media_assignments (section_id, sort_order);
create index if not exists idx_media_assignments_media on public.media_assignments (media_id);
create index if not exists idx_media_sections_sort on public.media_sections (sort_order);

drop trigger if exists trg_media_sections_updated on public.media_sections;
create trigger trg_media_sections_updated
before update on public.media_sections
for each row execute function public.set_updated_at();

drop trigger if exists trg_media_updated on public.media;
create trigger trg_media_updated
before update on public.media
for each row execute function public.set_updated_at();

drop trigger if exists trg_media_assignments_updated on public.media_assignments;
create trigger trg_media_assignments_updated
before update on public.media_assignments
for each row execute function public.set_updated_at();

alter table public.media_sections enable row level security;
alter table public.media enable row level security;
alter table public.media_assignments enable row level security;

-- Public read: anyone on the site can SELECT sections + published media + published assignments.
drop policy if exists "Public read sections" on public.media_sections;
create policy "Public read sections"
on public.media_sections for select
using (true);

drop policy if exists "Public read media" on public.media;
create policy "Public read media"
on public.media for select
using (true);

drop policy if exists "Public read published assignments" on public.media_assignments;
create policy "Public read published assignments"
on public.media_assignments for select
using (published = true);

-- Authenticated (admin) full access.
drop policy if exists "Authenticated users manage sections" on public.media_sections;
create policy "Authenticated users manage sections"
on public.media_sections for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage media" on public.media;
create policy "Authenticated users manage media"
on public.media for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage assignments" on public.media_assignments;
create policy "Authenticated users manage assignments"
on public.media_assignments for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Seed sections.
insert into public.media_sections (id, title, kind, sort_order) values
  ('hero-video',          'Hero video',                    'single', 10),
  ('about-building',      'About · building front',        'single', 20),
  ('tech-action-video',   'Tech action video',             'single', 30),
  ('service-area-video',  'Service area video',            'single', 40),
  ('technician-portrait', 'Technician portrait',           'single', 50),
  ('office-more',         'More from our office',          'strip',  60),
  ('team-at-work',        'Our team at work',              'strip',  70),
  ('equipment-installed', 'Equipment we install',          'strip',  80),
  ('field-locations',     'Field locations',               'strip',  90),
  ('gallery-people',      'Gallery · People',              'strip', 100),
  ('gallery-work',        'Gallery · Work',                'strip', 110),
  ('gallery-location',    'Gallery · Location',            'strip', 120),
  ('gallery-reviews',     'Gallery · Reviews',             'strip', 130)
on conflict (id) do nothing;
```

- [ ] **Step 2: Lint the SQL visually**

Read through once. Confirm every `section_id` in the seed matches the list above — IDs become part of the URL (`/admin/media/[sectionId]`) and code constants, so typos compound.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260417_media_management.sql
git commit -m "feat(db): add media, media_sections, media_assignments tables"
```

---

### Task 6: Apply the migration

**Files:** none modified (DB change only).

- [ ] **Step 1: Apply via Supabase dashboard**

1. Open https://supabase.com/dashboard → the project linked in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`).
2. Navigate to **SQL Editor → New query**.
3. Paste the full contents of `supabase/migrations/20260417_media_management.sql`.
4. Click **Run**.
5. Expected: "Success. No rows returned."

- [ ] **Step 2: Verify the tables exist**

In the SQL Editor run:
```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('media_sections','media','media_assignments')
order by table_name;
```
Expected: three rows, `media`, `media_assignments`, `media_sections`.

- [ ] **Step 3: Verify the seeds loaded**

```sql
select id, kind, sort_order from public.media_sections order by sort_order;
```
Expected: 13 rows in the order above.

- [ ] **Step 4: No commit — DB-only operation.**

---

### Task 7: Extend `database.types.ts`

**Files:**
- Modify: `./lib/supabase/database.types.ts`

- [ ] **Step 1: Read the existing type file to match its style**

Open the file and scroll to the `Database` type. Find the `public.Tables` block with entries for `clients`, `services`, etc.

- [ ] **Step 2: Add the three new table entries under `public.Tables`**

Inside the object literal of `public.Tables`, alongside the existing entries, add:

```ts
      media_sections: {
        Row: {
          id: string;
          title: string;
          kind: "single" | "strip";
          enabled: boolean;
          layout: "marquee" | "grid" | "carousel";
          scroll_direction: "left" | "right";
          scroll_speed: "slow" | "medium" | "fast";
          items_visible: number;
          show_captions: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          kind: "single" | "strip";
          enabled?: boolean;
          layout?: "marquee" | "grid" | "carousel";
          scroll_direction?: "left" | "right";
          scroll_speed?: "slow" | "medium" | "fast";
          items_visible?: number;
          show_captions?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          kind?: "single" | "strip";
          enabled?: boolean;
          layout?: "marquee" | "grid" | "carousel";
          scroll_direction?: "left" | "right";
          scroll_speed?: "slow" | "medium" | "fast";
          items_visible?: number;
          show_captions?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          type: "image" | "video";
          storage_path: string;
          caption: string | null;
          alt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: "image" | "video";
          storage_path: string;
          caption?: string | null;
          alt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: "image" | "video";
          storage_path?: string;
          caption?: string | null;
          alt?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_assignments: {
        Row: {
          id: string;
          media_id: string;
          section_id: string;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          section_id: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sort_order?: number;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "media_assignments_media_id_fkey"; columns: ["media_id"]; referencedRelation: "media"; referencedColumns: ["id"] },
          { foreignKeyName: "media_assignments_section_id_fkey"; columns: ["section_id"]; referencedRelation: "media_sections"; referencedColumns: ["id"] }
        ];
      };
```

- [ ] **Step 3: Export convenience aliases**

At the bottom of the file (next to existing `ClientInsert`, `ServiceInsert`, etc. aliases), add:
```ts
export type MediaRow = Database["public"]["Tables"]["media"]["Row"];
export type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
export type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];
export type MediaSectionRow = Database["public"]["Tables"]["media_sections"]["Row"];
export type MediaSectionUpdate = Database["public"]["Tables"]["media_sections"]["Update"];
export type MediaAssignmentRow = Database["public"]["Tables"]["media_assignments"]["Row"];
export type MediaAssignmentInsert = Database["public"]["Tables"]["media_assignments"]["Insert"];
export type MediaAssignmentUpdate = Database["public"]["Tables"]["media_assignments"]["Update"];
```

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "feat(types): add media, media_sections, media_assignments types"
```

---

### Task 8: Create Supabase Storage bucket + policies

**Files:**
- Create: `./supabase/migrations/20260417_media_storage_bucket.sql` (kept as documentation — the bucket is created via dashboard since Storage DDL is unusual).

- [ ] **Step 1: Create the bucket via dashboard**

In Supabase dashboard → **Storage → Create bucket**:
- Name: `site-media`
- Public bucket: **ON** (so the public site can render images/videos without signed URLs)
- File size limit: `100 MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/quicktime, video/webm`

Click **Create bucket**.

- [ ] **Step 2: Add the storage RLS policy for service-role writes**

Supabase auto-creates a `storage.objects` table. The service role (used by our server actions) bypasses RLS, so no policy is strictly required for uploads. Public read on a public bucket is built-in. Still, record intent:

Create `supabase/migrations/20260417_media_storage_bucket.sql` with:
```sql
-- Reference-only migration for the site-media bucket.
-- Applied manually via the Supabase dashboard (Storage → Create bucket).
--
-- Name: site-media
-- Public: true
-- File size limit: 100 MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif,
--                     video/mp4, video/quicktime, video/webm
--
-- Writes go through the service role (SUPABASE_SERVICE_ROLE_KEY) via
-- server actions in app/admin/(protected)/media/actions.ts, so no
-- additional storage.objects RLS is required here. The bucket being
-- public handles the read side on the public site.
```

- [ ] **Step 3: Verify the bucket from the dashboard**

Navigate to **Storage → Buckets**. Confirm `site-media` appears with the Public badge.

- [ ] **Step 4: Smoke-test public read**

Upload any small test JPEG to `site-media/` via the dashboard file uploader. Copy its **Public URL** (right-click → Copy URL). Open it in a browser — it should render without auth.

Then delete the test file so production stays clean.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260417_media_storage_bucket.sql
git commit -m "docs(db): record site-media storage bucket provisioning"
```

---

## Phase 3 — Media domain library (tasks 9–11)

### Task 9: Section schema (`lib/media/schema.ts`)

**Files:**
- Create: `./lib/media/schema.ts`

- [ ] **Step 1: Write the schema**

```ts
export const SECTION_KINDS = ["single", "strip"] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const LAYOUTS = ["marquee", "grid", "carousel"] as const;
export type SectionLayout = (typeof LAYOUTS)[number];

export const SCROLL_DIRECTIONS = ["left", "right"] as const;
export type ScrollDirection = (typeof SCROLL_DIRECTIONS)[number];

export const SCROLL_SPEEDS = ["slow", "medium", "fast"] as const;
export type ScrollSpeed = (typeof SCROLL_SPEEDS)[number];

export const MEDIA_TYPES = ["image", "video"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface SectionSeed {
  id: string;
  kind: SectionKind;
  title: string;
  // Optional default to render when no published media_assignment exists.
  // For single-kind sections: path to the hardcoded asset under /public.
  // For strip-kind sections: empty array (strips render nothing when empty).
  fallback?:
    | { type: MediaType; path: string }
    | { type: MediaType; path: string }[];
}

/**
 * The canonical list of sections. Mirrors the seed rows inserted by
 * 20260417_media_management.sql. Adding a section here also requires
 * a matching insert in a new migration.
 */
export const SECTION_SEEDS: SectionSeed[] = [
  { id: "hero-video", kind: "single", title: "Hero video",
    fallback: { type: "video", path: "/media/hero-video.mp4" } },
  { id: "about-building", kind: "single", title: "About · building front",
    fallback: { type: "image", path: "/media/building-front.jpg" } },
  { id: "tech-action-video", kind: "single", title: "Tech action video",
    fallback: { type: "video", path: "/media/generated/tech-hands.mp4" } },
  { id: "service-area-video", kind: "single", title: "Service area video",
    fallback: { type: "video", path: "/media/okc-location-loop.mp4" } },
  { id: "technician-portrait", kind: "single", title: "Technician portrait",
    fallback: { type: "image", path: "/media/generated/hero-technician.png" } },
  { id: "office-more", kind: "strip", title: "More from our office" },
  { id: "team-at-work", kind: "strip", title: "Our team at work" },
  { id: "equipment-installed", kind: "strip", title: "Equipment we install" },
  { id: "field-locations", kind: "strip", title: "Field locations" },
  { id: "gallery-people", kind: "strip", title: "People" },
  { id: "gallery-work", kind: "strip", title: "Work" },
  { id: "gallery-location", kind: "strip", title: "Location" },
  { id: "gallery-reviews", kind: "strip", title: "Reviews" },
];

export const SECTION_BY_ID: Record<string, SectionSeed> = Object.fromEntries(
  SECTION_SEEDS.map((s) => [s.id, s])
);

export function isSectionId(value: unknown): value is string {
  return typeof value === "string" && value in SECTION_BY_ID;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/media/schema.ts
git commit -m "feat(media): section schema + seed definitions"
```

---

### Task 10: Public data access (`lib/media/data.ts`)

**Files:**
- Create: `./lib/media/data.ts`

- [ ] **Step 1: Write the data helpers**

```ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MediaRow,
  MediaAssignmentRow,
  MediaSectionRow,
} from "@/lib/supabase/database.types";
import { SECTION_BY_ID, type SectionSeed } from "./schema";

export interface SectionItem {
  assignment: MediaAssignmentRow;
  media: MediaRow;
}

export interface SectionPayload {
  seed: SectionSeed;
  section: MediaSectionRow | null;
  items: SectionItem[];
}

/**
 * Fetches config + ordered published media for a section.
 * Returns seed + empty items if the section doesn't exist yet (defensive).
 */
export async function getSection(sectionId: string): Promise<SectionPayload | null> {
  const seed = SECTION_BY_ID[sectionId];
  if (!seed) return null;

  const supabase = await createSupabaseServerClient();

  const { data: sectionRow } = await supabase
    .from("media_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("media_assignments")
    .select("*, media(*)")
    .eq("section_id", sectionId)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const items: SectionItem[] = (rows ?? [])
    .filter((row) => row.media !== null)
    .map((row) => {
      const { media, ...assignment } = row as MediaAssignmentRow & { media: MediaRow };
      return { assignment, media };
    });

  return { seed, section: sectionRow ?? null, items };
}

/**
 * Convenience for loading several sections at once (home page).
 */
export async function getSections(ids: string[]): Promise<Record<string, SectionPayload>> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await getSection(id)] as const)
  );
  return Object.fromEntries(
    entries.filter(([, payload]) => payload !== null) as [string, SectionPayload][]
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/media/data.ts
git commit -m "feat(media): server-side data helpers"
```

---

### Task 11: Storage URL resolver (`lib/media/url.ts`) + path helpers

**Files:**
- Create: `./lib/media/url.ts`
- Create: `./lib/media/storage.ts`

- [ ] **Step 1: Create `lib/media/storage.ts`**

```ts
export const MEDIA_BUCKET = "site-media";

/**
 * Builds a deterministic storage path for a new upload.
 * Example: "2026-04/e7f3-beach-job.mp4"
 */
export function buildStoragePath(fileName: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const suffix = crypto.randomUUID().slice(0, 8);
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${year}-${month}/${suffix}-${safe}`;
}
```

- [ ] **Step 2: Create `lib/media/url.ts`**

```ts
import { getSupabaseBrowserCredentials } from "@/lib/supabase/config";
import { MEDIA_BUCKET } from "./storage";

/**
 * Resolves a Supabase Storage path in the site-media bucket
 * to its fully-qualified public URL.
 */
export function getMediaPublicUrl(storagePath: string): string {
  const { url } = getSupabaseBrowserCredentials();
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/media/storage.ts lib/media/url.ts
git commit -m "feat(media): storage path + public URL helpers"
```

---

## Phase 4 — Admin media: actions + list + nav (tasks 12–14)

### Task 12: Server actions (`actions.ts`)

**Files:**
- Create: `./app/admin/(protected)/media/actions.ts`

- [ ] **Step 1: Write the actions file**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LAYOUTS,
  MEDIA_TYPES,
  SCROLL_DIRECTIONS,
  SCROLL_SPEEDS,
  SECTION_BY_ID,
  isSectionId,
  type MediaType,
  type SectionLayout,
  type ScrollDirection,
  type ScrollSpeed,
} from "@/lib/media/schema";
import { MEDIA_BUCKET, buildStoragePath } from "@/lib/media/storage";
import type { ActionResult } from "@/app/admin/actions";

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    throw new Error("Your admin session expired. Sign in again.");
  }
}

function revalidateMediaPaths(sectionId?: string) {
  revalidatePath("/admin/media");
  revalidatePath("/");
  revalidatePath("/gallery");
  if (sectionId) revalidatePath(`/admin/media/${sectionId}`);
}

function mediaTypeFromFile(file: File): MediaType {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
}

export async function uploadMedia(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Pick a file before uploading." };
    }

    const caption = (formData.get("caption") as string | null)?.trim() || null;
    const alt = (formData.get("alt") as string | null)?.trim() || null;
    const sectionIds = formData.getAll("section_ids").filter((v): v is string => typeof v === "string" && isSectionId(v));

    const mediaType = mediaTypeFromFile(file);
    if (!MEDIA_TYPES.includes(mediaType)) {
      return { ok: false, error: "Only image or video files are supported." };
    }

    const path = buildStoragePath(file.name);

    const admin = createSupabaseAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(MEDIA_BUCKET)
      .upload(path, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) return { ok: false, error: `Upload failed: ${uploadError.message}` };

    const { data: mediaRow, error: insertError } = await admin
      .from("media")
      .insert({ type: mediaType, storage_path: path, caption, alt })
      .select("id")
      .single();

    if (insertError || !mediaRow) {
      await admin.storage.from(MEDIA_BUCKET).remove([path]);
      return { ok: false, error: insertError?.message ?? "Could not save media record." };
    }

    if (sectionIds.length) {
      const assignments = sectionIds.map((section_id) => ({
        media_id: mediaRow.id,
        section_id,
        published: true,
        sort_order: 0,
      }));
      const { error: assignError } = await admin.from("media_assignments").insert(assignments);
      if (assignError) {
        return { ok: false, error: `Upload saved but assignments failed: ${assignError.message}` };
      }
    }

    revalidateMediaPaths();
    return { ok: true, id: mediaRow.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function updateMedia(input: {
  id: string;
  caption: string | null;
  alt: string | null;
  sectionIds: string[];
}): Promise<ActionResult> {
  try {
    await requireSession();
    const admin = createSupabaseAdminClient();

    const { error: updateError } = await admin
      .from("media")
      .update({ caption: input.caption, alt: input.alt })
      .eq("id", input.id);
    if (updateError) return { ok: false, error: updateError.message };

    const valid = input.sectionIds.filter(isSectionId);
    const { data: existing } = await admin
      .from("media_assignments")
      .select("section_id")
      .eq("media_id", input.id);
    const existingIds = new Set((existing ?? []).map((r) => r.section_id));
    const desired = new Set(valid);

    const toAdd = valid.filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !desired.has(id));

    if (toAdd.length) {
      await admin.from("media_assignments").insert(
        toAdd.map((section_id) => ({
          media_id: input.id,
          section_id,
          published: true,
          sort_order: 0,
        }))
      );
    }
    if (toRemove.length) {
      await admin
        .from("media_assignments")
        .delete()
        .eq("media_id", input.id)
        .in("section_id", toRemove);
    }

    revalidateMediaPaths();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function deleteMedia(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    const admin = createSupabaseAdminClient();

    const { data: media } = await admin
      .from("media")
      .select("storage_path")
      .eq("id", input.id)
      .maybeSingle();

    const { error: deleteError } = await admin.from("media").delete().eq("id", input.id);
    if (deleteError) return { ok: false, error: deleteError.message };

    if (media?.storage_path) {
      await admin.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
    }

    revalidateMediaPaths();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Delete failed." };
  }
}

export async function togglePublished(input: {
  mediaId: string;
  sectionId: string;
  published: boolean;
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!isSectionId(input.sectionId)) return { ok: false, error: "Unknown section." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("media_assignments")
      .update({ published: input.published })
      .eq("media_id", input.mediaId)
      .eq("section_id", input.sectionId);
    if (error) return { ok: false, error: error.message };
    revalidateMediaPaths(input.sectionId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function reorderAssignment(input: {
  mediaId: string;
  sectionId: string;
  direction: "up" | "down";
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!isSectionId(input.sectionId)) return { ok: false, error: "Unknown section." };
    const admin = createSupabaseAdminClient();

    const { data: all } = await admin
      .from("media_assignments")
      .select("id, media_id, sort_order")
      .eq("section_id", input.sectionId)
      .order("sort_order", { ascending: true });

    if (!all?.length) return { ok: false, error: "Nothing to reorder." };

    const index = all.findIndex((a) => a.media_id === input.mediaId);
    if (index < 0) return { ok: false, error: "Assignment not found." };
    const swapIndex = input.direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= all.length) return { ok: true };

    const a = all[index];
    const b = all[swapIndex];

    await admin.from("media_assignments").update({ sort_order: b.sort_order }).eq("id", a.id);
    await admin.from("media_assignments").update({ sort_order: a.sort_order }).eq("id", b.id);

    revalidateMediaPaths(input.sectionId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Reorder failed." };
  }
}

export async function updateSectionConfig(input: {
  id: string;
  enabled: boolean;
  title: string;
  layout: SectionLayout;
  scrollDirection: ScrollDirection;
  scrollSpeed: ScrollSpeed;
  itemsVisible: number;
  showCaptions: boolean;
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!isSectionId(input.id)) return { ok: false, error: "Unknown section." };
    if (!LAYOUTS.includes(input.layout)) return { ok: false, error: "Unknown layout." };
    if (!SCROLL_DIRECTIONS.includes(input.scrollDirection)) return { ok: false, error: "Unknown scroll direction." };
    if (!SCROLL_SPEEDS.includes(input.scrollSpeed)) return { ok: false, error: "Unknown scroll speed." };

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("media_sections")
      .update({
        enabled: input.enabled,
        title: input.title,
        layout: input.layout,
        scroll_direction: input.scrollDirection,
        scroll_speed: input.scrollSpeed,
        items_visible: Math.max(2, Math.min(6, input.itemsVisible)),
        show_captions: input.showCaptions,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    revalidateMediaPaths(input.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Update failed." };
  }
}

_void SECTION_BY_ID; // keep tree-shaker from dropping the import when only types used
```

Remove the `_void SECTION_BY_ID;` line from the final file — it was a placeholder. Actually just delete that last line entirely.

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/media/actions.ts"
git commit -m "feat(admin): media server actions (upload/update/delete/reorder)"
```

---

### Task 13: Add "Media" to admin nav

**Files:**
- Modify: `./components/admin/admin-nav.tsx`

- [ ] **Step 1: Update the `navItems` array**

In `components/admin/admin-nav.tsx`, change:
```ts
const navItems = [
  { href: "/admin", label: "Clients" },
  { href: "/admin/attention", label: "Attention" },
  { href: "/admin/account", label: "Password" },
];
```
to:
```ts
const navItems = [
  { href: "/admin", label: "Clients" },
  { href: "/admin/attention", label: "Attention" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/account", label: "Password" },
];
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/admin-nav.tsx
git commit -m "feat(admin): add Media nav entry"
```

---

### Task 14: Admin media list page

**Files:**
- Create: `./app/admin/(protected)/media/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SECTION_SEEDS } from "@/lib/media/schema";
import { MediaUploadForm } from "@/components/admin/media-upload-form";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const admin = createSupabaseAdminClient();

  const { data: sections } = await admin
    .from("media_sections")
    .select("id, title, enabled, kind")
    .order("sort_order", { ascending: true });

  const { data: recentMedia } = await admin
    .from("media")
    .select("id, type, storage_path, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: assignmentCounts } = await admin
    .from("media_assignments")
    .select("section_id")
    .eq("published", true);

  const countsBySection = (assignmentCounts ?? []).reduce<Record<string, number>>(
    (acc, row) => ({ ...acc, [row.section_id]: (acc[row.section_id] ?? 0) + 1 }),
    {}
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="display-heading text-3xl text-white">Media</h1>
        <p className="text-[var(--copy-soft)]">
          Upload photos and videos, assign them to sections, and tune how each section looks on the site.
        </p>
      </header>

      <section className="admin-panel space-y-4 rounded-2xl border border-white/10 p-5">
        <h2 className="text-lg font-bold text-white">Upload new media</h2>
        <MediaUploadForm sections={SECTION_SEEDS} />
      </section>

      <section className="admin-panel space-y-4 rounded-2xl border border-white/10 p-5">
        <h2 className="text-lg font-bold text-white">Sections</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SECTION_SEEDS.map((seed) => {
            const row = sections?.find((s) => s.id === seed.id);
            const count = countsBySection[seed.id] ?? 0;
            return (
              <li key={seed.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <Link
                  href={`/admin/media/${seed.id}`}
                  className="flex items-center justify-between gap-2 text-white hover:text-[var(--ice-soft)]"
                >
                  <span>
                    <span className="block font-semibold">{seed.title}</span>
                    <span className="text-xs uppercase tracking-[0.15em] text-[var(--copy-muted)]">
                      {seed.kind} · {count} item{count === 1 ? "" : "s"}
                      {row && !row.enabled ? " · disabled" : ""}
                    </span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="admin-panel space-y-4 rounded-2xl border border-white/10 p-5">
        <h2 className="text-lg font-bold text-white">Recent uploads</h2>
        {recentMedia?.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recentMedia.map((m) => (
              <li key={m.id} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-[var(--copy-soft)]">
                <div className="truncate">{m.caption ?? m.storage_path.split("/").pop()}</div>
                <div className="mt-1 flex justify-between text-[var(--copy-muted)]">
                  <span>{m.type}</span>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--copy-muted)]">No uploads yet.</p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0 (component import will fail — next task creates it, so verify after Task 15. Skip this check here if needed.).

Actually, commit Task 15 together with Task 14 if the typecheck blocks you. The page file alone won't type-check until the upload form exists.

- [ ] **Step 3: Commit**

Skip the commit until Task 15 completes — they depend on each other.

---

## Phase 5 — Admin forms (tasks 15–17)

### Task 15: Media upload form

**Files:**
- Create: `./components/admin/media-upload-form.tsx`

- [ ] **Step 1: Write the form**

```tsx
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { uploadMedia } from "@/app/admin/(protected)/media/actions";
import type { SectionSeed } from "@/lib/media/schema";

export function MediaUploadForm({ sections }: { sections: SectionSeed[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());

  function toggleSection(id: string) {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    selectedSections.forEach((id) => formData.append("section_ids", id));

    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (result.ok) {
        setMessage({ kind: "ok", text: "Uploaded." });
        form.reset();
        setSelectedSections(new Set());
      } else {
        setMessage({ kind: "err", text: result.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[var(--copy-muted)]">
          File (image or video, up to 100 MB)
        </label>
        <input
          type="file"
          name="file"
          required
          accept="image/*,video/*"
          className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[var(--copy-muted)]">
            Caption (shown when captions are enabled)
          </label>
          <input
            type="text"
            name="caption"
            className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[var(--copy-muted)]">
            Alt text (for screen readers)
          </label>
          <input
            type="text"
            name="alt"
            className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--copy-muted)]">
          Which sections does this belong in?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {sections.map((s) => (
            <label key={s.id} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <input
                type="checkbox"
                checked={selectedSections.has(s.id)}
                onChange={() => toggleSection(s.id)}
              />
              <span>{s.title} <span className="text-xs text-[var(--copy-muted)]">({s.kind})</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      {message ? (
        <p className={`text-sm ${message.kind === "ok" ? "text-emerald-300" : "text-amber-300"}`}>
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="primary-button inline-flex rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] disabled:opacity-60"
      >
        {isPending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit (bundles tasks 14 + 15)**

```bash
git add "app/admin/(protected)/media/page.tsx" components/admin/media-upload-form.tsx
git commit -m "feat(admin): media dashboard page + upload form"
```

---

### Task 16: Per-section admin page + edit/reorder UI

**Files:**
- Create: `./app/admin/(protected)/media/[sectionId]/page.tsx`
- Create: `./components/admin/section-settings-form.tsx`
- Create: `./components/admin/media-reorder-list.tsx`

- [ ] **Step 1: Create `section-settings-form.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { updateSectionConfig } from "@/app/admin/(protected)/media/actions";
import type { MediaSectionRow } from "@/lib/supabase/database.types";
import { LAYOUTS, SCROLL_DIRECTIONS, SCROLL_SPEEDS } from "@/lib/media/schema";

export function SectionSettingsForm({ section }: { section: MediaSectionRow }) {
  const [form, setForm] = useState({
    enabled: section.enabled,
    title: section.title,
    layout: section.layout,
    scrollDirection: section.scroll_direction,
    scrollSpeed: section.scroll_speed,
    itemsVisible: section.items_visible,
    showCaptions: section.show_captions,
  });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    startTransition(async () => {
      const result = await updateSectionConfig({ id: section.id, ...form });
      setMessage(result.ok ? "Saved." : result.error);
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex items-center gap-2 text-sm text-white sm:col-span-2">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
        />
        Section enabled (hide entirely from the public site when off)
      </label>

      <label className="text-sm text-white sm:col-span-2">
        Title
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        />
      </label>

      <label className="text-sm text-white">
        Layout
        <select
          value={form.layout}
          onChange={(e) => setForm({ ...form, layout: e.target.value as typeof form.layout })}
          className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        >
          {LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label className="text-sm text-white">
        Scroll direction
        <select
          value={form.scrollDirection}
          onChange={(e) => setForm({ ...form, scrollDirection: e.target.value as typeof form.scrollDirection })}
          className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        >
          {SCROLL_DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>

      <label className="text-sm text-white">
        Scroll speed
        <select
          value={form.scrollSpeed}
          onChange={(e) => setForm({ ...form, scrollSpeed: e.target.value as typeof form.scrollSpeed })}
          className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        >
          {SCROLL_SPEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <label className="text-sm text-white">
        Items visible (2–6)
        <input
          type="number"
          min={2}
          max={6}
          value={form.itemsVisible}
          onChange={(e) => setForm({ ...form, itemsVisible: Number(e.target.value) })}
          className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-white sm:col-span-2">
        <input
          type="checkbox"
          checked={form.showCaptions}
          onChange={(e) => setForm({ ...form, showCaptions: e.target.checked })}
        />
        Show captions on hover
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="primary-button rounded-full px-5 py-2 text-sm font-extrabold uppercase tracking-[0.12em] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save section settings"}
        </button>
        {message ? <span className="text-sm text-[var(--copy-soft)]">{message}</span> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `media-reorder-list.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import Image from "next/image";
import {
  deleteMedia,
  reorderAssignment,
  togglePublished,
} from "@/app/admin/(protected)/media/actions";
import { getMediaPublicUrl } from "@/lib/media/url";
import type { MediaAssignmentRow, MediaRow } from "@/lib/supabase/database.types";

export function MediaReorderList({
  sectionId,
  items,
}: {
  sectionId: string;
  items: { assignment: MediaAssignmentRow; media: MediaRow }[];
}) {
  const [isPending, startTransition] = useTransition();

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-[var(--copy-muted)]">No media in this section yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {items.map((item, index) => {
        const url = getMediaPublicUrl(item.media.storage_path);
        return (
          <li
            key={item.assignment.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2"
          >
            <div className="h-16 w-24 overflow-hidden rounded-md bg-black">
              {item.media.type === "image" ? (
                <Image
                  src={url}
                  alt={item.media.alt ?? ""}
                  width={96}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <video src={url} muted className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <div className="text-white">{item.media.caption ?? item.media.storage_path.split("/").pop()}</div>
              <div className="text-xs text-[var(--copy-muted)]">
                {item.media.type} · {item.assignment.published ? "published" : "hidden"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                disabled={isPending || index === 0}
                onClick={() => act(() => reorderAssignment({ mediaId: item.media.id, sectionId, direction: "up" }))}
                className="rounded-md border border-white/10 px-2 py-1 text-white disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={isPending || index === items.length - 1}
                onClick={() => act(() => reorderAssignment({ mediaId: item.media.id, sectionId, direction: "down" }))}
                className="rounded-md border border-white/10 px-2 py-1 text-white disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => act(() => togglePublished({ mediaId: item.media.id, sectionId, published: !item.assignment.published }))}
                className="rounded-md border border-white/10 px-2 py-1 text-white disabled:opacity-40"
              >
                {item.assignment.published ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (confirm("Delete this media everywhere? This cannot be undone.")) {
                    act(() => deleteMedia({ id: item.media.id }));
                  }
                }}
                className="rounded-md border border-red-400/40 px-2 py-1 text-red-200 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 3: Create the per-section page**

Create `app/admin/(protected)/media/[sectionId]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SECTION_BY_ID } from "@/lib/media/schema";
import { SectionSettingsForm } from "@/components/admin/section-settings-form";
import { MediaReorderList } from "@/components/admin/media-reorder-list";
import type { MediaAssignmentRow, MediaRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const seed = SECTION_BY_ID[sectionId];
  if (!seed) notFound();

  const admin = createSupabaseAdminClient();
  const { data: section } = await admin
    .from("media_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();

  if (!section) notFound();

  const { data: rows } = await admin
    .from("media_assignments")
    .select("*, media(*)")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: true });

  const items = (rows ?? [])
    .filter((r) => r.media !== null)
    .map((r) => {
      const { media, ...assignment } = r as MediaAssignmentRow & { media: MediaRow };
      return { assignment, media };
    });

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link href="/admin/media" className="text-xs uppercase tracking-[0.15em] text-[var(--copy-muted)]">
          ← Media
        </Link>
        <h1 className="display-heading text-3xl text-white">{section.title}</h1>
        <p className="text-[var(--copy-soft)]">Kind: {seed.kind}</p>
      </header>

      <section className="admin-panel space-y-4 rounded-2xl border border-white/10 p-5">
        <h2 className="text-lg font-bold text-white">Display settings</h2>
        <SectionSettingsForm section={section} />
      </section>

      <section className="admin-panel space-y-4 rounded-2xl border border-white/10 p-5">
        <h2 className="text-lg font-bold text-white">Items</h2>
        <MediaReorderList sectionId={sectionId} items={items} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/media/[sectionId]/page.tsx" \
        components/admin/section-settings-form.tsx \
        components/admin/media-reorder-list.tsx
git commit -m "feat(admin): per-section config + reorder/hide/delete controls"
```

---

### Task 17: End-to-end admin verification

**Files:** none.

- [ ] **Step 1: Start the dev server**

```bash
cd .
npm run dev
```

- [ ] **Step 2: Sign in to admin**

Visit `http://localhost:3000/admin/login`, sign in with owner creds from Supabase.

- [ ] **Step 3: Click the new "Media" tab**

Expected: dashboard loads with 13 section cards, upload form, empty recent-uploads list.

- [ ] **Step 4: Upload a small test JPEG**

In the upload form:
- File: any small JPEG on disk (a screenshot works).
- Caption: `plan test photo`
- Check two sections: `Gallery · People` and `Our team at work`.
- Click Upload.

Expected: message changes to "Uploaded." Recent uploads shows the new item.

- [ ] **Step 5: Visit the per-section page**

Click the "People" section. Confirm:
- Title shows "Gallery · People".
- Display-settings form is populated with defaults.
- Items list shows the uploaded item.

- [ ] **Step 6: Exercise reorder / hide / delete**

Upload a second JPEG (same flow, assign to same section). Return to the section page. Click ↑/↓, then Hide, then Show on one of them. Verify Supabase rows change (SQL editor: `select sort_order, published from media_assignments order by sort_order;`).

- [ ] **Step 7: Delete one item**

Click Delete, accept confirm. Confirm the row vanishes from the UI and from Storage (dashboard → `site-media` bucket).

- [ ] **Step 8: Edit section settings**

Switch Layout to `grid`, save. Confirm `media_sections.layout` updates via SQL editor.

- [ ] **Step 9: Kill dev server.**

- [ ] **Step 10: No commit — verification task.**

---

## Phase 6 — Public render (tasks 18–22)

### Task 18: Next.js config — image remote patterns + server action body size

**Files:**
- Modify: `./next.config.ts`

- [ ] **Step 1: Derive the Supabase hostname**

```bash
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```
Extract the hostname (everything between `https://` and the next `/`). Example: `abcdexyz.supabase.co`.

- [ ] **Step 2: Rewrite `next.config.ts`**

Replace the file contents with:

```ts
import type { NextConfig } from "next";

const SUPABASE_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: SUPABASE_HOSTNAME
      ? [
          {
            protocol: "https",
            hostname: SUPABASE_HOSTNAME,
            pathname: "/storage/v1/object/public/site-media/**",
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
```

- [ ] **Step 3: Restart dev server to pick up config**

Stop and restart `npm run dev`.

- [ ] **Step 4: Verify typecheck + successful build start**

Confirm dev server logs `Ready` with no config errors.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts
git commit -m "chore(next): allow Supabase Storage images + raise action body limit"
```

---

### Task 19: Public render components

**Files:**
- Create: `./components/media/single-media-slot.tsx`
- Create: `./components/media/media-strip.tsx`

- [ ] **Step 1: Create `single-media-slot.tsx`**

```tsx
import Image from "next/image";
import { getSection } from "@/lib/media/data";
import { getMediaPublicUrl } from "@/lib/media/url";

interface SingleMediaSlotProps {
  sectionId: string;
  width: number;
  height: number;
  className?: string;
  videoClassName?: string;
  priority?: boolean;
  poster?: string;
  alt?: string;
}

export async function SingleMediaSlot({
  sectionId,
  width,
  height,
  className,
  videoClassName,
  priority,
  poster,
  alt: explicitAlt,
}: SingleMediaSlotProps) {
  const payload = await getSection(sectionId);
  if (!payload) return null;

  const firstItem = payload.items[0];
  if (firstItem && payload.section?.enabled !== false) {
    const url = getMediaPublicUrl(firstItem.media.storage_path);
    const alt = explicitAlt ?? firstItem.media.alt ?? firstItem.media.caption ?? "";
    if (firstItem.media.type === "video") {
      return (
        <video
          className={videoClassName ?? className}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
        >
          <source src={url} type="video/mp4" />
        </video>
      );
    }
    return (
      <Image
        src={url}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={className}
      />
    );
  }

  const fallback = payload.seed.fallback;
  if (!fallback || Array.isArray(fallback)) return null;

  if (fallback.type === "video") {
    return (
      <video
        className={videoClassName ?? className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={fallback.path} type="video/mp4" />
      </video>
    );
  }

  return (
    <Image
      src={fallback.path}
      alt={explicitAlt ?? ""}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
```

- [ ] **Step 2: Create `media-strip.tsx`**

```tsx
import Image from "next/image";
import { getSection } from "@/lib/media/data";
import { getMediaPublicUrl } from "@/lib/media/url";

export async function MediaStrip({ sectionId }: { sectionId: string }) {
  const payload = await getSection(sectionId);
  if (!payload) return null;
  if (payload.section?.enabled === false) return null;
  if (payload.items.length === 0) return null;

  const section = payload.section;
  const layout = section?.layout ?? "marquee";
  const direction = section?.scroll_direction ?? "left";
  const speed = section?.scroll_speed ?? "medium";
  const itemsVisible = section?.items_visible ?? 4;
  const showCaptions = section?.show_captions ?? true;

  const items = payload.items.map(({ assignment, media }) => ({
    id: assignment.id,
    type: media.type,
    url: getMediaPublicUrl(media.storage_path),
    caption: media.caption,
    alt: media.alt ?? media.caption ?? "",
  }));

  if (layout === "marquee") {
    // Duplicate items for seamless loop.
    const duplicated = [...items, ...items];
    return (
      <section className="media-strip media-strip--marquee" aria-label={section?.title ?? undefined}>
        {section?.title ? <h3 className="media-strip__title">{section.title}</h3> : null}
        <div className="media-marquee" data-direction={direction} data-speed={speed}>
          <div className="media-marquee__track">
            {duplicated.map((item, idx) => (
              <figure key={`${item.id}-${idx}`} className="media-marquee__item">
                {item.type === "image" ? (
                  <Image src={item.url} alt={item.alt} width={480} height={320} className="media-marquee__img" />
                ) : (
                  <video src={item.url} autoPlay muted loop playsInline className="media-marquee__img" />
                )}
                {showCaptions && item.caption ? (
                  <figcaption className="media-marquee__caption">{item.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "grid") {
    return (
      <section className="media-strip media-strip--grid" aria-label={section?.title ?? undefined}>
        {section?.title ? <h3 className="media-strip__title">{section.title}</h3> : null}
        <div className="media-grid" style={{ ["--cols" as string]: itemsVisible }}>
          {items.map((item) => (
            <figure key={item.id} className="media-grid__item">
              {item.type === "image" ? (
                <Image src={item.url} alt={item.alt} width={480} height={320} className="media-grid__img" />
              ) : (
                <video src={item.url} autoPlay muted loop playsInline className="media-grid__img" />
              )}
              {showCaptions && item.caption ? (
                <figcaption className="media-grid__caption">{item.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </section>
    );
  }

  // carousel — simple CSS scroll-snap.
  return (
    <section className="media-strip media-strip--carousel" aria-label={section?.title ?? undefined}>
      {section?.title ? <h3 className="media-strip__title">{section.title}</h3> : null}
      <div className="media-carousel" style={{ ["--cols" as string]: itemsVisible }}>
        {items.map((item) => (
          <figure key={item.id} className="media-carousel__item">
            {item.type === "image" ? (
              <Image src={item.url} alt={item.alt} width={480} height={320} className="media-carousel__img" />
            ) : (
              <video src={item.url} autoPlay muted loop playsInline className="media-carousel__img" />
            )}
            {showCaptions && item.caption ? (
              <figcaption className="media-carousel__caption">{item.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/media/single-media-slot.tsx components/media/media-strip.tsx
git commit -m "feat(media): public render components (single-slot + strip)"
```

---

### Task 20: Global styles for marquee/grid/carousel

**Files:**
- Modify: `./app/globals.css`

- [ ] **Step 1: Append new styles at the bottom of `globals.css`**

```css
/* === Media strip (public render) ======================================== */
.media-strip {
  margin: 3rem auto;
  max-width: 80rem;
  padding: 0 1.25rem;
}
.media-strip__title {
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--copy-muted);
  margin-bottom: 1rem;
}

/* Marquee */
.media-marquee {
  overflow: hidden;
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 8%,
    #000 92%,
    transparent 100%
  );
}
.media-marquee__track {
  display: flex;
  gap: 1rem;
  width: max-content;
  animation-name: media-marquee-shift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-duration: 40s;
}
.media-marquee[data-speed="slow"] .media-marquee__track { animation-duration: 80s; }
.media-marquee[data-speed="medium"] .media-marquee__track { animation-duration: 40s; }
.media-marquee[data-speed="fast"] .media-marquee__track { animation-duration: 20s; }
.media-marquee[data-direction="right"] .media-marquee__track { animation-direction: reverse; }
.media-marquee:hover .media-marquee__track { animation-play-state: paused; }

.media-marquee__item {
  flex: 0 0 22rem;
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
  background: rgba(255,255,255,0.04);
}
.media-marquee__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-marquee__caption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 0.75rem 1rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.75));
  color: #fff;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.media-marquee__item:hover .media-marquee__caption { opacity: 1; }

@keyframes media-marquee-shift {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* Grid */
.media-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr));
}
.media-grid__item {
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
  background: rgba(255,255,255,0.04);
}
.media-grid__img { width: 100%; height: 100%; object-fit: cover; }
.media-grid__caption {
  position: absolute; inset: auto 0 0 0; padding: .5rem .75rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: #fff;
  font-size: 0.75rem; opacity: 0; transition: opacity 0.2s ease;
}
.media-grid__item:hover .media-grid__caption { opacity: 1; }

/* Carousel */
.media-carousel {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - (var(--cols, 4) - 1) * 1rem) / var(--cols, 4));
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.5rem;
}
.media-carousel__item {
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
  scroll-snap-align: start;
  background: rgba(255,255,255,0.04);
}
.media-carousel__img { width: 100%; height: 100%; object-fit: cover; }
.media-carousel__caption {
  position: absolute; inset: auto 0 0 0; padding: .5rem .75rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: #fff;
  font-size: 0.75rem;
}

@media (max-width: 640px) {
  .media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .media-marquee__item { flex-basis: 16rem; }
}
```

- [ ] **Step 2: Verify in dev server**

Restart `npm run dev`, visit any page. No CSS errors in the Next.js console.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style(media): marquee/grid/carousel layouts"
```

---

### Task 21: Wire `<SingleMediaSlot>` into `app/page.tsx`

**Files:**
- Modify: `./app/page.tsx`

- [ ] **Step 1: Add import at the top of the file**

Next to the existing imports, add:
```ts
import { SingleMediaSlot } from "@/components/media/single-media-slot";
import { MediaStrip } from "@/components/media/media-strip";
```

- [ ] **Step 2: Replace the hero video**

Around line 425, the file currently has:
```tsx
<video
  ...
  poster="/media/hero-video-poster.jpg"
  ...
>
  <source src="/media/hero-video.mp4" type="video/mp4" />
</video>
```

Replace the inner `<video>` with:
```tsx
<SingleMediaSlot
  sectionId="hero-video"
  width={1920}
  height={1080}
  priority
  poster="/media/hero-video-poster.jpg"
  videoClassName="<PRESERVE_EXISTING_VIDEO_CLASSNAME>"
/>
```
Replace `<PRESERVE_EXISTING_VIDEO_CLASSNAME>` with the exact `className` string that was on the `<video>` element at that line. Do NOT remove the surrounding wrapper `<div>` / section — just swap the element.

- [ ] **Step 3: Replace the about/building-front image**

Around line 540, find:
```tsx
<Image src="/media/building-front.jpg" ... />
```
Replace with:
```tsx
<SingleMediaSlot
  sectionId="about-building"
  width={<existing-width>}
  height={<existing-height>}
  className="<existing-className>"
  alt="<existing-alt>"
/>
```
Copy the existing width/height/className/alt attributes verbatim.

- [ ] **Step 4: Replace the tech action video**

Around line 1039, find the `<video>` with `<source src="/media/generated/tech-hands.mp4" .../>`.

Replace the entire `<video>...</video>` tag with:
```tsx
<SingleMediaSlot
  sectionId="tech-action-video"
  width={1280}
  height={720}
  videoClassName="<existing-video-className>"
/>
```

- [ ] **Step 5: Replace the service-area video**

Around line 1140, find the `<video>` with `<source src="/media/okc-location-loop.mp4" .../>` and poster `/media/okc.jpg`.

Replace with:
```tsx
<SingleMediaSlot
  sectionId="service-area-video"
  width={1280}
  height={720}
  poster="/media/okc.jpg"
  videoClassName="<existing-video-className>"
/>
```

- [ ] **Step 6: Replace the technician portrait**

Around line 1089, find `<Image src="/media/generated/hero-technician.png" ... />`.

Replace with:
```tsx
<SingleMediaSlot
  sectionId="technician-portrait"
  width={<existing-width>}
  height={<existing-height>}
  className="<existing-className>"
  alt="<existing-alt>"
/>
```

- [ ] **Step 7: Insert companion strips**

After the closing tag of the "About / building-front" section, add:
```tsx
<MediaStrip sectionId="office-more" />
```

After the closing tag of the "Team/service strip" section (~ line 830), add:
```tsx
<MediaStrip sectionId="team-at-work" />
```

After the closing tag of the "Equipment showcase" section (~ line 1032), add:
```tsx
<MediaStrip sectionId="equipment-installed" />
```

After the closing tag of the "Service area video" section (~ line 1157), add:
```tsx
<MediaStrip sectionId="field-locations" />
```

> If you are unsure exactly where a section ends, search for the next `</section>` closing tag after the relevant video/image and insert the `<MediaStrip>` right after it. Each strip is self-contained — it gracefully renders nothing when empty.

- [ ] **Step 8: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 9: Visit the home page in dev**

Restart `npm run dev`, visit `http://localhost:3000`. Expected: unchanged visual appearance (seeds render since no uploaded assignments exist for these sections) + empty strips render nothing.

- [ ] **Step 10: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): swap hardcoded hero/feature media to SingleMediaSlot + companion strips"
```

---

### Task 22: End-to-end home page verification

**Files:** none.

- [ ] **Step 1: Dev server running + signed into admin.**

- [ ] **Step 2: Upload a photo and assign it to `office-more`**

Via `/admin/media`, upload a test JPEG with caption "Test companion strip" assigned only to "More from our office".

- [ ] **Step 3: Refresh the home page**

Expected: immediately below the About/building-front section, a new strip titled "More from our office" appears with the single uploaded image in a short marquee.

- [ ] **Step 4: Upload a photo and assign it to `hero-video` section**

Although named "hero-video", uploading an IMAGE to it will still work (our renderer selects based on media.type). For this test, upload a JPEG.

Refresh the home page. Expected: the hero area now shows the uploaded image instead of `hero-video.mp4`. (The seed video is the fallback when no assignment exists.)

Then delete that assignment/media from `/admin/media/hero-video` to restore the seed video. Refresh home. Expected: seed video returns.

- [ ] **Step 5: No commit — verification task.**

---

## Phase 7 — Gallery page + main nav (tasks 23–24)

### Task 23: Gallery page

**Files:**
- Create: `./app/gallery/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { MediaStrip } from "@/components/media/media-strip";

export const metadata: Metadata = {
  title: "Gallery · Double Le Heat and Air",
  description: "Real people, real work, real places — and what our customers say.",
};

const GALLERY_SECTIONS: { id: string; label: string }[] = [
  { id: "gallery-people",   label: "People" },
  { id: "gallery-work",     label: "Work" },
  { id: "gallery-location", label: "Location" },
  { id: "gallery-reviews",  label: "Reviews" },
];

export default function GalleryPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--copy-muted)]">Gallery</p>
          <h1 className="display-heading text-4xl text-white sm:text-5xl">
            Real people. Real work. Real places.
          </h1>
          <nav className="flex flex-wrap gap-2 pt-2 text-xs font-bold uppercase tracking-[0.16em]">
            {GALLERY_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-white/15 px-3 py-1 text-[var(--copy-soft)] transition hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </header>

        {GALLERY_SECTIONS.map((s) => (
          <div id={s.id} key={s.id} className="scroll-mt-28">
            <MediaStrip sectionId={s.id} />
          </div>
        ))}
      </div>
    </SiteShell>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Visit `/gallery` in dev**

Expected: the header renders with four anchor buttons. Each `MediaStrip` is empty today (until content is uploaded to those sections).

- [ ] **Step 4: Upload to verify**

Via `/admin/media`, upload any JPEG to `Gallery · Work`. Refresh `/gallery`. Expected: Work strip appears; others remain hidden.

- [ ] **Step 5: Commit**

```bash
git add app/gallery/page.tsx
git commit -m "feat: gallery page with People/Work/Location/Reviews sections"
```

---

### Task 24: Add Gallery link to main site nav + footer

**Files:**
- Modify: `./components/site-shell.tsx`

- [ ] **Step 1: Add `/gallery` to the desktop nav**

Inside the `<nav className="hidden ... md:flex">` block, after the `Service Area` link, insert:
```tsx
<Link className="transition hover:text-white" href="/gallery">Gallery</Link>
```

- [ ] **Step 2: Add `/gallery` to the footer nav**

Inside the footer `<nav>` block with `Home / About / Services / Service Area / Reviews / Contact`, after `Service Area`, insert:
```tsx
<Link className="transition hover:text-white" href="/gallery">Gallery</Link>
```

- [ ] **Step 3: Verify typecheck + visit any public page**

```bash
npx tsc --noEmit
```
Visit `/` in dev. Expected: a new "Gallery" entry appears in header and footer.

- [ ] **Step 4: Commit**

```bash
git add components/site-shell.tsx
git commit -m "feat(nav): add Gallery link to header + footer"
```

---

## Phase 8 — Final end-to-end verification (task 25)

### Task 25: Full-flow smoke test

**Files:** none.

- [ ] **Step 1: Clean dev restart**

```bash
cd .
npm run dev
```

- [ ] **Step 2: SMS flow**

Submit `/contact` form with real details. Confirm:
- Owner phone receives SMS within ~30 s.
- Resend email arrives.
- Admin `/admin` shows the new `lead` row.

- [ ] **Step 3: Media flow — single slot override**

In `/admin/media/hero-video`, upload a new hero image. Confirm home page hero reflects it. Toggle "Hide" on that assignment. Confirm home reverts to seed video.

- [ ] **Step 4: Media flow — companion strip**

Upload 3+ photos assigned to `Our team at work`. Configure the section to Layout=`marquee`, Speed=`slow`, Captions=`on`. Visit home page. Confirm the strip renders with the correct speed and caption reveals on hover.

- [ ] **Step 5: Gallery flow**

Upload photos to each of the four gallery sections. Visit `/gallery`. Confirm anchor buttons jump to the correct sections and all four strips render.

- [ ] **Step 6: Disabled section**

On `/admin/media/gallery-reviews`, toggle `enabled` off. Refresh `/gallery`. Confirm Reviews strip disappears while the other three remain.

- [ ] **Step 7: Delete cleanup**

Delete any test media you no longer want. Confirm rows remove from both `media` table and Supabase Storage.

- [ ] **Step 8: Production env checklist**

Before deploying to Vercel, add these env vars in the Vercel project settings (Production + Preview):
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
CONTACT_SMS_TO
```
(Supabase env vars already exist.)

- [ ] **Step 9: Commit a final README-style note (optional)**

If desired, append a short "Media / SMS operations" section to `README.md` describing how to upload, how to manage Twilio, and the verified-caller-ID requirement.

```bash
git add README.md  # if edited
git commit -m "docs: note media management + Twilio caller-ID requirement"
```

---

## Self-review (done before handoff)

**Spec coverage check:**
- ✅ SMS to owner's phone — Tasks 1–4.
- ✅ Admin can upload media — Tasks 12, 15.
- ✅ Admin can edit/delete/reorder + hide/show — Tasks 12, 16.
- ✅ Replaceable single-item slots with seed fallback — Tasks 19, 21.
- ✅ Companion strips below existing sections — Tasks 19, 20, 21.
- ✅ `/gallery` page with People/Work/Location/Reviews — Tasks 23, 24.
- ✅ Admin-configurable layout / scroll direction / scroll speed / items visible / captions — Tasks 12, 16.
- ✅ Gallery link in main nav — Task 24.
- ✅ Seeds retained as defaults — Task 19 fallback logic + `SECTION_SEEDS` in Task 9.
- ✅ Per-section enable/disable — Task 12 (`updateSectionConfig`) + Task 19 (render skips when disabled).

**Placeholder scan:** no "TBD" / "similar to" / un-coded steps. Every step with code shows the code inline. The one step that says "remove the `_void SECTION_BY_ID;` line" is an explicit cleanup instruction, not a placeholder.

**Type consistency:** `SectionLayout`, `ScrollDirection`, `ScrollSpeed`, `MediaType` used identically across `schema.ts`, `actions.ts`, `section-settings-form.tsx`, and `media-strip.tsx`. `MEDIA_BUCKET` constant imported consistently. `ActionResult` reused from `@/app/admin/actions`.

**Tech-debt acknowledged (not scoped for this plan):**
- Manual type additions to `database.types.ts` — a future task can switch to `supabase gen types` if the team adopts the CLI workflow.
- No server-side video transcoding — uploads remain in the original format. If phone MP4s are too large, a later task can add compression via Supabase Edge Function or `ffmpeg` in a Vercel Function.
- Upload progress UI is binary (pending/done). Could add per-file progress later.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-17-sms-and-media-uploads.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
