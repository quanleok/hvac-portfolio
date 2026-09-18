# Marketing · Social Post Composer (Phase 1a) — Design

Date: 2026-04-19
Status: Draft (awaiting user review)
Owner: Quan

## Problem

The Double Le HVAC admin has a Marketing placeholder at `/admin/marketing` but no functionality. The owner wants to post field photos/videos to social platforms to grow the brand, but has no lightweight workflow for it. Existing paid/free tools (Buffer, Later, Ayrshare) either cost money or require credential handoff that we've decided against.

## Goal

Ship a mobile-first "launch-pad composer" that lets the business owner draft, schedule, and hand off social posts (Facebook + YouTube in v1) to native apps on his phone via the Web Share API. Zero third-party API integration, zero credential storage, free forever.

## Non-goals for v1

- True automated posting (no Graph API, no TikTok/X/LinkedIn/Instagram-direct)
- Analytics / post performance tracking
- Multi-user collaboration or draft review workflow
- AI-generated captions
- Cross-posting a single piece of content to multiple platforms in one flow
- Multi-image Facebook albums (v1 supports one image per FB post)
- Video uploads larger than 50MB (owner can upload big files direct to YouTube if needed)
- SMS reminders (deferred until Twilio TFV approves)

## User & context

- **Primary user:** the business owner, Cong Minh Le, using an iPhone in the field.
- **Secondary user:** Quan (the freelancer admin), occasionally helping compose from desktop.
- **Auth model:** both log into the existing admin via `requireAdminSession()`; no new role model needed.
- **Reminder destination:** `CONTACT_RECIPIENT_EMAIL` (defaults to `doublelehvac@gmail.com`).

## Constraints

- Must follow the existing admin server-action pattern (`actions.ts`, `ActionResult<T>`, `requireSession()`, `revalidatePath()`).
- Must follow the compact-solid-color admin visual style (no pills, gradients, alpha layers).
- New DB tables are applied manually via the Supabase dashboard SQL editor; `lib/supabase/database.types.ts` is hand-maintained.
- No Twilio SMS reminders until TFV `HH9720268ba54e6a18fefe1ef58a178768` approves.
- Mobile-first responsive layout — minimum 44×44px tap targets, iOS photo/video picker compatibility.

## Architecture overview

Reuses the existing admin conventions:

- Server actions in `app/admin/(protected)/marketing/actions.ts`
- `requireSession()` gate identical to `app/admin/(protected)/website/actions.ts`
- `ActionResult<T>` return shape
- Supabase admin client for writes, `revalidatePath()` after mutations
- New private Supabase Storage bucket `marketing-media` (separate from public `site-media`)
- New DB tables `marketing_posts` + `marketing_post_media` (separate from site `media` table to keep RLS and queries clean)
- Vercel Cron for scheduled-post reminders
- Shared Resend helper at `lib/notifications/email.ts` (refactor-extract from current inline `fetch` call in `app/api/contact/route.ts`)

### Code layout

```
app/admin/(protected)/marketing/
  page.tsx                      ← posts list grouped by status (draft / scheduled / posted)
  new/facebook/page.tsx         ← FB composer
  new/youtube/page.tsx          ← YouTube composer
  [id]/page.tsx                 ← single post: edit OR launchpad (state-dependent)
  actions.ts                    ← createPost / updatePost / schedule / markPosted / deletePost
  components/
    facebook-composer.tsx       ← form: photo picker + caption + schedule/share buttons
    youtube-composer.tsx        ← form: video picker + title + description + schedule/share
    share-launchpad.tsx         ← client component: Web Share API invoker + desktop fallback
    post-row.tsx                ← list item in the posts list
app/api/cron/marketing-reminders/route.ts  ← Vercel Cron endpoint
lib/marketing/
  schema.ts                     ← PLATFORMS, STATUSES, type exports
  storage.ts                    ← MARKETING_BUCKET = "marketing-media"; buildStoragePath()
  share.ts                      ← canShareFiles() detection helper
lib/notifications/email.ts      ← sendEmail({ to, subject, html, text }) — new shared helper
supabase/migrations/20260419_marketing_posts.sql
components/admin/admin-nav.tsx  ← flip the Marketing nav entry from `disabled: true` to live (entry already exists)
vercel.json                     ← new file (no Vercel config exists in the repo today); holds the cron schedule
```

## Data model

```sql
create table public.marketing_posts (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null check (platform in ('facebook', 'youtube')),
  status        text not null default 'draft'
                check (status in ('draft', 'scheduled', 'posted', 'archived')),
  body          text,                          -- caption (FB) or description (YT)
  title         text,                          -- YouTube video title; null for FB
  scheduled_at  timestamptz,
  reminded_at   timestamptz,
  posted_at     timestamptz,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.marketing_post_media (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.marketing_posts(id) on delete cascade,
  kind           text not null check (kind in ('image', 'video')),
  storage_path   text not null,
  mime_type      text not null,
  size_bytes     bigint not null,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_marketing_posts_status_scheduled on public.marketing_posts (status, scheduled_at);
create index idx_marketing_post_media_post on public.marketing_post_media (post_id, sort_order);

alter table public.marketing_posts enable row level security;
alter table public.marketing_post_media enable row level security;

create policy "admins manage posts" on public.marketing_posts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admins manage post media" on public.marketing_post_media
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Re-use the existing set_updated_at() trigger function from media migration
drop trigger if exists trg_marketing_posts_updated on public.marketing_posts;
create trigger trg_marketing_posts_updated
before update on public.marketing_posts
for each row execute function public.set_updated_at();
```

Plus appended type definitions in `lib/supabase/database.types.ts` mirroring the existing `media` / `media_assignments` entries.

### Storage bucket

- Name: `marketing-media`
- Public: **no** (private; reads go through signed URLs generated in server actions)
- MIME whitelist enforced client-side AND in the server action: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`.
- Size limits: images ≤10MB, videos ≤50MB. Rejection in the server action with a friendly error message.

## User flows

### FB post (happy path, mobile)

1. `/admin/marketing` → big tap-button **"+ New Facebook post"** (second button: "+ New YouTube upload"). Below: list of drafts, scheduled, and recently posted items.
2. `/admin/marketing/new/facebook` → form:
   - Large photo tap-zone (invokes `<input type="file" accept="image/*" capture="environment">` so iPhone opens camera/library picker directly)
   - Caption textarea (multiline, autogrow)
   - Two bottom-sticky buttons: **[Schedule]** and **[Share now]**
3. Tap **[Share now]** → server action `createPost({ platform: 'facebook', body, image })`:
   - Uploads image to `marketing-media`
   - Inserts `marketing_posts` row with `status='draft'`
   - Inserts `marketing_post_media` row
   - Returns `{ ok: true, id }`
4. Client redirects to `/admin/marketing/[id]` → **launchpad screen** (mobile-only Web Share UX):
   - Shows caption preview + image thumbnail
   - Single big button: **[Share to Facebook]** → calls `navigator.share({ text: caption, files: [imageFile] })`
   - iOS share sheet pops up with image attached + caption pre-filled → owner taps Facebook icon → FB app opens → he hits Post
5. Returns to launchpad → **[I posted it]** button → server action `markPosted({ id })` → redirects to list

### YouTube upload

Identical shape to FB flow. Form fields: title + description + video picker. Launchpad shares with `navigator.share({ text: title + "\n\n" + description, files: [videoFile] })` → iOS share sheet → owner picks YouTube app → uploads.

### Scheduled flow

Diverges at step 3: tap **[Schedule]** → datetime picker (timezone America/Chicago, stored UTC) → server action `schedulePost({ id, scheduledAt })` → status `scheduled`. Cron fires reminder email at `scheduled_at`, containing a one-click link to `/admin/marketing/[id]` (the launchpad). From there, flow continues at step 4.

### Desktop fallback

On the launchpad, client checks `typeof navigator.canShare === 'function' && navigator.canShare({ files: [...] })`. If false:

- Button row becomes: **[Copy caption]** (clipboard) + **[Download media]** (signed URL) + **[Open Facebook]** / **[Open YouTube Studio]** (new tab)
- Owner manually pastes caption and uploads media on the platform

### Edit / delete / archive

- Post detail page shows **[Edit]** if status is `draft` or `scheduled`. Launch same form pre-filled.
- **[Delete]** available at any status (with confirm). Cascades to media storage cleanup.
- **[Archive]** moves posted items out of the main list (soft-hide). No hard delete by default.

## Scheduling & reminders

**Cron endpoint:** `app/api/cron/marketing-reminders/route.ts`, scheduled via a new `vercel.json` (no Vercel config file currently exists in the repo):

```json
{
  "crons": [
    { "path": "/api/cron/marketing-reminders", "schedule": "*/15 * * * *" }
  ]
}
```

**Auth:** Vercel injects header `Authorization: Bearer <CRON_SECRET>`; route rejects with 401 if absent/mismatched. Env var `CRON_SECRET` must be added to Vercel project.

**Query:**
```sql
select id, platform, title, body, scheduled_at from marketing_posts
where status = 'scheduled'
  and scheduled_at <= now()
  and reminded_at is null;
```

**Per match:**
- Send email via `lib/notifications/email.ts` to `CONTACT_RECIPIENT_EMAIL` (default `doublelehvac@gmail.com`):
  - Subject: `Time to post: {title or truncated body}`
  - Body contains short message + deep-link to `https://www.double-le-hvac.com/admin/marketing/[id]`
- Update `reminded_at = now()`

**Granularity:** 15-minute cron ⇒ reminders fire up to ~15 min late. Good enough for HVAC social posting.

**Timezone:** scheduler UI uses `America/Chicago` for display; DB stores UTC. No DST-handling gymnastics.

## Visual style

Per `feedback_admin_visual_style`:

- `bg-[#07101c]` page, `bg-[#0f1c2d]` cards, `border-[#25344a]` dividers
- `bg-[#1f6feb]` primary buttons, `bg-[#1a2c44]` secondary
- No pills, gradients, alpha overlays, or drop shadows beyond the existing admin
- Minimum 44×44px tap targets on all mobile buttons
- Sticky bottom action bar on composer forms (common iOS pattern)

## Error handling

- **Client-side validation:** required fields soft-checked before submit (caption for FB, title+video for YT).
- **Server-side validation:** hard-checked in actions. Returns `{ ok: false, error: string }` consistent with existing admin actions.
- **Media size/MIME rejection:** clear message like "Image must be JPEG/PNG/WebP under 10MB."
- **Upload failures:** if Storage upload succeeds but DB insert fails, the action deletes the orphaned Storage object before returning error — pattern from existing `uploadMedia`.
- **Share API failures:** if `navigator.share` throws (user cancels or unsupported mid-flow), catch silently and fall back to the desktop Copy+Download+Open UI inline (no redirect).
- **Cron failures:** individual email failures logged with `console.error` but don't short-circuit the batch. A post that fails to reminder stays with `reminded_at = null` and retries next cron tick.

## Testing approach

- **Manual mobile test:** on iPhone Safari, the owner's flow end-to-end — compose FB post, share to Facebook, verify post arrives on the FB Page.
- **Manual desktop test:** Chrome desktop (no file-share support) — verify desktop fallback appears with Copy/Download/Open buttons.
- **Cron smoke test:** schedule a post 1 minute in the future, wait 15 min, verify reminder email arrives at `doublelehvac@gmail.com`.
- **No automated tests in v1** — existing admin code has none; not introducing that pattern here.

## Out of scope / future phases

- **Phase 1b:** Meta Graph API OAuth integration (replaces Web Share for FB+IG, adds true auto-posting). Meta App Review should be started in parallel with Phase 1a ship since approval takes weeks.
- **Phase 2:** Facebook Ads integration (deep-link to Ads Manager first; Ads API if needed).
- **Phase 3:** Agent chat integration — Hermes/OpenClaw composes and schedules posts via the same server actions as the UI.
- Multi-image FB albums
- Instagram / X / TikTok / Nextdoor support
- Post analytics
- Review-request SMS/email generator (lives in Marketing but separate feature)

## Open questions / assumptions being made

- **Cron cadence:** 15 minutes feels right for HVAC low-frequency posting. If the owner ever needs sub-15-min precision, bump cron to every 5 min — but unlikely.
- **Storage cleanup:** when a post is deleted, its media is removed from Storage. When a post is archived, media is kept. Assumption: disk is cheap, archive keeps history.
- **Orphaned uploads:** if composer is abandoned mid-upload (window closed), Storage object is left. Acceptable for v1; a nightly cleanup cron can be added later if it becomes an issue.
