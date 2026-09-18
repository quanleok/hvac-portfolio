# Marketing Social Post Composer (Phase 1a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first social post composer at `/admin/marketing` that lets the Double Le HVAC owner draft, schedule, and hand off Facebook and YouTube posts to the native app on his phone via the Web Share API. Deep-link fallback on desktop. Cron-driven email reminders.

**Architecture:** Two separate composers (FB, YouTube) writing to a shared `marketing_posts` + `marketing_post_media` table, backed by a private `marketing-media` Supabase Storage bucket. Scheduling uses Vercel Cron hitting `/api/cron/marketing-reminders` every 15 min, which fires reminder emails via a new shared `lib/notifications/email.ts` Resend helper (extracted from the existing contact route). Mobile launchpad screen calls `navigator.share({ text, files })` to trigger the iOS share sheet; desktop falls back to copy-caption + download-media + open-platform buttons.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Supabase (SSR auth + Postgres + Storage), Resend (transactional email), Vercel Cron. Admin follows the existing `ActionResult<T>` + `requireSession()` server-action pattern.

**Testing note:** The existing `doubleleheatandair` codebase has no automated test suite and the spec explicitly does not introduce one. Each task's verify step is manual: `pnpm typecheck` / `pnpm lint` for code health, plus browser-based smoke verification where UI is touched. Reference `doubleleheatandair/docs/superpowers/specs/2026-04-19-marketing-social-composer-design.md` for the full design.

**Branching:** Work on `main`. Each task commits independently per the project's existing small-commit cadence (see recent `git log`).

**Prerequisites before starting:**
- Confirm `pnpm install` has already been run in `doubleleheatandair/`
- Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` populated (it does, per session context)
- Confirm `CRON_SECRET` will be added to the Vercel project env after Task 14 lands

---

## Task 1: Database migration — `marketing_posts` + `marketing_post_media`

**Files:**
- Create: `supabase/migrations/20260419_marketing_posts.sql`

- [ ] **Step 1: Write the migration**

Content of `supabase/migrations/20260419_marketing_posts.sql`:

```sql
-- Marketing social-post composer (Phase 1a).
-- Stores one row per drafted/scheduled/posted social post plus its attached media.
-- Admin-only via RLS; no public read.

create extension if not exists pgcrypto;

-- 1. marketing_posts: one row per Facebook post or YouTube upload.
create table if not exists public.marketing_posts (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null check (platform in ('facebook', 'youtube')),
  status        text not null default 'draft'
                check (status in ('draft', 'scheduled', 'posted', 'archived')),
  body          text,
  title         text,
  scheduled_at  timestamptz,
  reminded_at   timestamptz,
  posted_at     timestamptz,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. marketing_post_media: one row per image/video attached to a post.
create table if not exists public.marketing_post_media (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.marketing_posts(id) on delete cascade,
  kind           text not null check (kind in ('image', 'video')),
  storage_path   text not null,
  mime_type      text not null,
  size_bytes     bigint not null,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_marketing_posts_status_scheduled
  on public.marketing_posts (status, scheduled_at);

create index if not exists idx_marketing_post_media_post
  on public.marketing_post_media (post_id, sort_order);

-- Reuse the shared updated_at trigger function created by 20260417_media_management.sql
drop trigger if exists trg_marketing_posts_updated on public.marketing_posts;
create trigger trg_marketing_posts_updated
before update on public.marketing_posts
for each row execute function public.set_updated_at();

alter table public.marketing_posts enable row level security;
alter table public.marketing_post_media enable row level security;

drop policy if exists "Authenticated users manage marketing posts" on public.marketing_posts;
create policy "Authenticated users manage marketing posts"
on public.marketing_posts for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage marketing post media" on public.marketing_post_media;
create policy "Authenticated users manage marketing post media"
on public.marketing_post_media for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
```

- [ ] **Step 2: Apply the migration**

Per the project convention documented in the Client memory, migrations are applied manually via the Supabase dashboard SQL editor — there is no `supabase db push` in this workflow.

Run: open the Supabase project dashboard → SQL Editor → paste the file contents → Run. Verify both tables appear in the Database → Tables view.

Expected: tables `public.marketing_posts` and `public.marketing_post_media` exist with RLS enabled.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260419_marketing_posts.sql
git commit -m "feat(marketing): add marketing_posts + marketing_post_media migration"
```

---

## Task 2: Storage bucket — `marketing-media` (private)

**Files:**
- Create: `supabase/migrations/20260419120000_marketing_media_storage_bucket.sql`

- [ ] **Step 1: Write the migration**

Content of `supabase/migrations/20260419120000_marketing_media_storage_bucket.sql`:

```sql
-- Provision the marketing-media storage bucket used for admin-composed social posts.
-- Private bucket: reads happen through signed URLs generated by server actions.
-- Size limit matches the spec: image ≤10MB, video ≤50MB. Cap at 50 MB total.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketing-media',
  'marketing-media',
  false,
  52428800, -- 50 MB
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

- [ ] **Step 2: Apply the migration**

Run: Supabase dashboard → SQL Editor → paste → Run. Verify in Storage → Buckets that `marketing-media` appears and `Public` is off.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260419120000_marketing_media_storage_bucket.sql
git commit -m "feat(marketing): add private marketing-media storage bucket"
```

---

## Task 3: Hand-update `database.types.ts` with the new tables

**Files:**
- Modify: `lib/supabase/database.types.ts`

- [ ] **Step 1: Locate the public-schema Tables block**

Open `lib/supabase/database.types.ts`. Find the `Tables: { ... }` section under `public:` (search for `media_assignments:` to land near the existing media types). Add the two new tables **before** the `media_assignments` entry so types stay alphabetically grouped with other `marketing_*` entries in the future.

- [ ] **Step 2: Insert the new table type blocks**

Add this block to the `Tables` section:

```ts
marketing_posts: {
  Row: {
    id: string;
    platform: "facebook" | "youtube";
    status: "draft" | "scheduled" | "posted" | "archived";
    body: string | null;
    title: string | null;
    scheduled_at: string | null;
    reminded_at: string | null;
    posted_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    platform: "facebook" | "youtube";
    status?: "draft" | "scheduled" | "posted" | "archived";
    body?: string | null;
    title?: string | null;
    scheduled_at?: string | null;
    reminded_at?: string | null;
    posted_at?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    platform?: "facebook" | "youtube";
    status?: "draft" | "scheduled" | "posted" | "archived";
    body?: string | null;
    title?: string | null;
    scheduled_at?: string | null;
    reminded_at?: string | null;
    posted_at?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
marketing_post_media: {
  Row: {
    id: string;
    post_id: string;
    kind: "image" | "video";
    storage_path: string;
    mime_type: string;
    size_bytes: number;
    sort_order: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    post_id: string;
    kind: "image" | "video";
    storage_path: string;
    mime_type: string;
    size_bytes: number;
    sort_order?: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    post_id?: string;
    kind?: "image" | "video";
    storage_path?: string;
    mime_type?: string;
    size_bytes?: number;
    sort_order?: number;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "marketing_post_media_post_id_fkey";
      columns: ["post_id"];
      referencedRelation: "marketing_posts";
      referencedColumns: ["id"];
    }
  ];
};
```

Also add helpful exported aliases at the bottom of the file (next to the existing `MediaRow` / `MediaInsert` exports if any, or near the other convenience exports — grep for `export type ClientRow`):

```ts
export type MarketingPostRow = Database["public"]["Tables"]["marketing_posts"]["Row"];
export type MarketingPostInsert = Database["public"]["Tables"]["marketing_posts"]["Insert"];
export type MarketingPostUpdate = Database["public"]["Tables"]["marketing_posts"]["Update"];

export type MarketingPostMediaRow = Database["public"]["Tables"]["marketing_post_media"]["Row"];
export type MarketingPostMediaInsert = Database["public"]["Tables"]["marketing_post_media"]["Insert"];
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no new errors related to these types.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "feat(types): add marketing_posts + marketing_post_media to database types"
```

---

## Task 4: `lib/marketing/schema.ts` — platform/status constants and types

**Files:**
- Create: `lib/marketing/schema.ts`

- [ ] **Step 1: Write the file**

Content of `lib/marketing/schema.ts`:

```ts
export const PLATFORMS = ["facebook", "youtube"] as const;
export type MarketingPlatform = (typeof PLATFORMS)[number];

export const STATUSES = ["draft", "scheduled", "posted", "archived"] as const;
export type MarketingStatus = (typeof STATUSES)[number];

export const MEDIA_KINDS = ["image", "video"] as const;
export type MarketingMediaKind = (typeof MEDIA_KINDS)[number];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
] as const;

export function isPlatform(value: unknown): value is MarketingPlatform {
  return typeof value === "string" && (PLATFORMS as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is MarketingStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function platformLabel(platform: MarketingPlatform): string {
  return platform === "facebook" ? "Facebook" : "YouTube";
}

export function platformOpenUrl(platform: MarketingPlatform): string {
  // YouTube Studio auto-redirects to the signed-in user's channel.
  return platform === "facebook"
    ? "https://www.facebook.com/"
    : "https://studio.youtube.com/";
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/marketing/schema.ts
git commit -m "feat(marketing): add schema constants and type guards"
```

---

## Task 5: `lib/marketing/storage.ts` — bucket + path helpers

**Files:**
- Create: `lib/marketing/storage.ts`

- [ ] **Step 1: Write the file**

Content of `lib/marketing/storage.ts`:

```ts
export const MARKETING_BUCKET = "marketing-media";

/**
 * Builds a deterministic storage path for a marketing-post upload.
 * Example: "facebook/2026-04/e7f3abcd-field-job.jpg"
 */
export function buildMarketingStoragePath(
  platform: "facebook" | "youtube",
  fileName: string
): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const suffix = crypto.randomUUID().slice(0, 8);
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${platform}/${year}-${month}/${suffix}-${safe}`;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/marketing/storage.ts
git commit -m "feat(marketing): add storage bucket + path helpers"
```

---

## Task 6: Extract Resend helper to `lib/notifications/email.ts`; refactor contact route

**Files:**
- Create: `lib/notifications/email.ts`
- Modify: `app/api/contact/route.ts`

- [ ] **Step 1: Write the shared email helper**

Content of `lib/notifications/email.ts`:

```ts
interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  sent: boolean;
  skipped?: "unconfigured";
  error?: string;
}

const DEFAULT_FROM = "Double Le HVAC <onboarding@resend.dev>";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, skipped: "unconfigured" };
  }

  const body = {
    from: input.from ?? process.env.CONTACT_FROM_EMAIL?.trim() ?? DEFAULT_FROM,
    to: Array.isArray(input.to) ? input.to : [input.to],
    reply_to: input.replyTo,
    subject: input.subject,
    html: input.html,
    text: input.text,
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        sent: false,
        error: `Resend ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown Resend error",
    };
  }
}
```

- [ ] **Step 2: Refactor `app/api/contact/route.ts` to use the helper**

Open `app/api/contact/route.ts`. Replace the existing inline `fetch("https://api.resend.com/emails", ...)` block with a call to the new `sendEmail` helper. Specifically:

Change the top imports to add:
```ts
import { sendEmail } from "@/lib/notifications/email";
```

Remove `DEFAULT_FROM_EMAIL` constant (the helper handles the default).

Replace the entire block from `const resendApiKey = process.env.RESEND_API_KEY?.trim();` through the `emailSent` assignment (lines 47–172 in the current file) with:

```ts
const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim() || DEFAULT_CONTACT_RECIPIENT;

const subject = discountApplied
  ? `[DISCOUNT APPLIED] New website request from ${name}`
  : `New website request from ${name}`;
const submittedAt = new Date().toLocaleString("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const discountBanner = discountApplied
  ? `<div style="margin-bottom: 20px; padding: 14px 16px; background: #c53030; border-radius: 6px; color: #fff; font-weight: 700;">
      Discount code applied: <code style="background: #fff; color: #c53030; padding: 2px 6px; border-radius: 3px;">${promoCode}</code> — $500 off on install
     </div>`
  : "";

const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12202f;">
    ${discountBanner}
    <h2 style="margin-bottom: 12px;">New website request</h2>
    <p style="margin: 0 0 16px;">A customer filled out the Double Le HVAC website form.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
      <tr><td style="padding: 8px 0; font-weight: 700;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">Email</td><td style="padding: 8px 0;">${email || "Not provided"}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">City</td><td style="padding: 8px 0;">${city || "Not provided"}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">Submitted</td><td style="padding: 8px 0;">${submittedAt}</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 16px; border-radius: 12px; background: #f3f6f9;">
      <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
      <p style="margin: 0; white-space: pre-wrap;">${message}</p>
    </div>
  </div>
`;

const text = [
  discountApplied ? `DISCOUNT APPLIED — code ${promoCode} — $500 off install` : null,
  "New website request",
  `Name: ${name}`,
  `Phone: ${phone}`,
  `Email: ${email || "Not provided"}`,
  `City: ${city || "Not provided"}`,
  `Submitted: ${submittedAt}`,
  "",
  "Message:",
  message,
]
  .filter((line): line is string => line !== null)
  .join("\n");

const emailResult = await sendEmail({
  to: recipient,
  subject,
  html,
  text,
  replyTo: email || undefined,
});

const emailSent = emailResult.sent;
if (!emailResult.sent && emailResult.error) {
  console.error("[contact] email error:", emailResult.error);
}
```

(Keep the existing DEFAULT_CONTACT_RECIPIENT constant at the top of the file. Leave the Supabase lead-capture block and the Twilio SMS block untouched — only the Resend portion changes.)

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
pnpm typecheck && pnpm lint
```
Expected: no new errors. If `from` default-handling differs, double-check nothing else imported `DEFAULT_FROM_EMAIL` (grep the codebase): `rg "DEFAULT_FROM_EMAIL"`

- [ ] **Step 4: Smoke test contact form still works**

Start dev server (`pnpm dev`), submit the existing contact form once in a browser, confirm you still receive the lead email at `doublelehvac@gmail.com`. If the Supabase lead row also still gets inserted, the refactor is safe.

- [ ] **Step 5: Commit**

```bash
git add lib/notifications/email.ts app/api/contact/route.ts
git commit -m "refactor(notifications): extract shared Resend helper from contact route"
```

---

## Task 7: `lib/marketing/share.ts` — client-side Web Share API detector

**Files:**
- Create: `lib/marketing/share.ts`

- [ ] **Step 1: Write the file**

Content of `lib/marketing/share.ts`:

```ts
/**
 * Whether the current browser can share a file payload via the Web Share API.
 * Falls back to false on desktop browsers / older browsers where files aren't supported.
 *
 * Call this from a client component only — it references `navigator`.
 */
export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

/**
 * Trigger the native share sheet. Returns true if the user completed the share
 * (which doesn't guarantee anything was actually posted — the user could have
 * cancelled inside the platform app). Returns false if the share API threw
 * or the user cancelled the share sheet itself.
 */
export async function shareFiles(input: {
  text: string;
  files: File[];
  title?: string;
}): Promise<boolean> {
  try {
    await navigator.share({
      title: input.title,
      text: input.text,
      files: input.files,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch a signed storage URL as a File so it can be handed to navigator.share().
 */
export async function fetchAsFile(
  signedUrl: string,
  fileName: string,
  mimeType: string
): Promise<File> {
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Could not load media (${response.status}).`);
  }
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/marketing/share.ts
git commit -m "feat(marketing): add Web Share API client helpers"
```

---

## Task 8: Server actions in `app/admin/(protected)/marketing/actions.ts`

**Files:**
- Create: `app/admin/(protected)/marketing/actions.ts`

- [ ] **Step 1: Write the file**

Content of `app/admin/(protected)/marketing/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  type MarketingPlatform,
} from "@/lib/marketing/schema";
import {
  MARKETING_BUCKET,
  buildMarketingStoragePath,
} from "@/lib/marketing/storage";
import type { ActionResult } from "@/app/admin/actions";

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    throw new Error("Your admin session expired. Sign in again.");
  }
  return data.claims.sub;
}

function revalidateMarketingPaths(id?: string) {
  revalidatePath("/admin/marketing");
  if (id) revalidatePath(`/admin/marketing/${id}`);
}

function validateFile(file: File, expectedKind: "image" | "video"): string | null {
  if (!file || file.size === 0) return "Pick a file before uploading.";
  if (expectedKind === "image") {
    if (!ALLOWED_IMAGE_MIMES.includes(file.type as (typeof ALLOWED_IMAGE_MIMES)[number])) {
      return "Image must be JPEG, PNG, or WebP.";
    }
    if (file.size > MAX_IMAGE_BYTES) return "Image must be under 10 MB.";
  } else {
    if (!ALLOWED_VIDEO_MIMES.includes(file.type as (typeof ALLOWED_VIDEO_MIMES)[number])) {
      return "Video must be MP4 or MOV.";
    }
    if (file.size > MAX_VIDEO_BYTES) return "Video must be under 50 MB.";
  }
  return null;
}

async function uploadPostMedia(
  postId: string,
  platform: MarketingPlatform,
  file: File,
  kind: "image" | "video"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const path = buildMarketingStoragePath(platform, file.name);
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(MARKETING_BUCKET)
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { ok: false, error: `Upload failed: ${uploadError.message}` };

  const { error: insertError } = await admin.from("marketing_post_media").insert({
    post_id: postId,
    kind,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (insertError) {
    await admin.storage.from(MARKETING_BUCKET).remove([path]);
    return { ok: false, error: insertError.message };
  }
  return { ok: true };
}

export async function createFacebookPost(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const createdBy = await requireSession();

    const body = (formData.get("body") as string | null)?.trim() || null;
    if (!body) return { ok: false, error: "Add a caption before posting." };

    const file = formData.get("image");
    if (!(file instanceof File)) return { ok: false, error: "Pick a photo." };
    const fileError = validateFile(file, "image");
    if (fileError) return { ok: false, error: fileError };

    const admin = createSupabaseAdminClient();
    const { data: post, error: postError } = await admin
      .from("marketing_posts")
      .insert({
        platform: "facebook",
        status: "draft",
        body,
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (postError || !post) {
      return { ok: false, error: postError?.message ?? "Could not create post." };
    }

    const mediaResult = await uploadPostMedia(post.id, "facebook", file, "image");
    if (!mediaResult.ok) {
      await admin.from("marketing_posts").delete().eq("id", post.id);
      return mediaResult;
    }

    revalidateMarketingPaths(post.id);
    return { ok: true, id: post.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Post could not be created.",
    };
  }
}

export async function createYouTubePost(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const createdBy = await requireSession();

    const title = (formData.get("title") as string | null)?.trim() || null;
    if (!title) return { ok: false, error: "Add a title before continuing." };

    const body = (formData.get("body") as string | null)?.trim() || null;

    const file = formData.get("video");
    if (!(file instanceof File)) return { ok: false, error: "Pick a video." };
    const fileError = validateFile(file, "video");
    if (fileError) return { ok: false, error: fileError };

    const admin = createSupabaseAdminClient();
    const { data: post, error: postError } = await admin
      .from("marketing_posts")
      .insert({
        platform: "youtube",
        status: "draft",
        title,
        body,
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (postError || !post) {
      return { ok: false, error: postError?.message ?? "Could not create post." };
    }

    const mediaResult = await uploadPostMedia(post.id, "youtube", file, "video");
    if (!mediaResult.ok) {
      await admin.from("marketing_posts").delete().eq("id", post.id);
      return mediaResult;
    }

    revalidateMarketingPaths(post.id);
    return { ok: true, id: post.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Post could not be created.",
    };
  }
}

export async function schedulePost(input: {
  id: string;
  scheduledAt: string; // ISO string from client (already in UTC)
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };

    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return { ok: false, error: "Invalid scheduled time." };
    }
    if (scheduledAt.getTime() < Date.now() - 60_000) {
      return { ok: false, error: "Scheduled time is in the past." };
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("marketing_posts")
      .update({
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
        reminded_at: null,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    revalidateMarketingPaths(input.id);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not schedule.",
    };
  }
}

export async function markPosted(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("marketing_posts")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidateMarketingPaths(input.id);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not mark posted.",
    };
  }
}

export async function deletePost(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };
    const admin = createSupabaseAdminClient();

    const { data: media } = await admin
      .from("marketing_post_media")
      .select("storage_path")
      .eq("post_id", input.id);

    const { error } = await admin.from("marketing_posts").delete().eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    if (media?.length) {
      await admin.storage
        .from(MARKETING_BUCKET)
        .remove(media.map((m) => m.storage_path));
    }

    revalidateMarketingPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete.",
    };
  }
}

export async function getSignedMediaUrl(input: {
  storagePath: string;
}): Promise<ActionResult<{ url: string }>> {
  try {
    await requireSession();
    if (!input.storagePath) return { ok: false, error: "Missing path." };
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage
      .from(MARKETING_BUCKET)
      .createSignedUrl(input.storagePath, 60 * 10); // 10 min
    if (error || !data?.signedUrl) {
      return { ok: false, error: error?.message ?? "Could not sign URL." };
    }
    return { ok: true, url: data.signedUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not sign URL.",
    };
  }
}

export async function archivePost(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("marketing_posts")
      .update({ status: "archived" })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidateMarketingPaths(input.id);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not archive.",
    };
  }
}

```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(protected\)/marketing/actions.ts
git commit -m "feat(marketing): add server actions for post CRUD and scheduling"
```

---

## Task 9: Facebook composer client component + page

**Files:**
- Create: `app/admin/(protected)/marketing/components/facebook-composer.tsx`
- Create: `app/admin/(protected)/marketing/new/facebook/page.tsx`

- [ ] **Step 1: Write the client composer component**

Content of `app/admin/(protected)/marketing/components/facebook-composer.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createFacebookPost, schedulePost } from "../actions";

export function FacebookComposer() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function submit() {
    setError(null);
    if (!caption.trim()) return setError("Write a caption.");
    if (!file) return setError("Pick a photo.");
    if (scheduleMode === "later" && !scheduleAt) return setError("Pick a date and time.");

    const formData = new FormData();
    formData.set("body", caption);
    formData.set("image", file);

    startTransition(async () => {
      const result = await createFacebookPost(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (scheduleMode === "later") {
        const scheduledAt = new Date(scheduleAt).toISOString();
        const scheduleResult = await schedulePost({ id: result.id, scheduledAt });
        if (!scheduleResult.ok) {
          setError(scheduleResult.error);
          return;
        }
        router.push(`/admin/marketing/${result.id}?scheduled=1`);
      } else {
        router.push(`/admin/marketing/${result.id}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <label className="block rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          Photo
        </span>
        <div className="mt-3 flex min-h-40 items-center justify-center rounded-md bg-[#07101c] border border-dashed border-[#25344a] p-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="max-h-64 w-auto object-contain" />
          ) : (
            <span className="text-sm text-[#9aafc5]">Tap to pick or shoot a photo</span>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="mt-3 block w-full text-sm text-[#9aafc5]"
        />
      </label>

      <label className="block">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          Caption
        </span>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          placeholder="Write the caption Facebook will see…"
          className="mt-2 w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
        />
      </label>

      <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4 space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          When
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode("now")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
              scheduleMode === "now"
                ? "border-[#1f6feb] bg-[#1f6feb] text-white"
                : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
            }`}
          >
            Post now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("later")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
              scheduleMode === "later"
                ? "border-[#1f6feb] bg-[#1f6feb] text-white"
                : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
            }`}
          >
            Schedule
          </button>
        </div>
        {scheduleMode === "later" && (
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white focus:border-[#3a4e6e] focus:outline-none"
          />
        )}
      </div>

      {error && (
        <p className="rounded-md border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full min-h-12 rounded-md bg-[#1f6feb] px-4 py-3 text-base font-extrabold text-white hover:bg-[#1a5ed1] disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : scheduleMode === "later"
            ? "Schedule post"
            : "Continue to share"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write the FB composer page**

Content of `app/admin/(protected)/marketing/new/facebook/page.tsx`:

```tsx
import Link from "next/link";
import { FacebookComposer } from "../../components/facebook-composer";

export const dynamic = "force-dynamic";

export default function NewFacebookPostPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/admin/marketing"
        className="text-sm font-bold text-[#9aafc5] hover:text-white"
      >
        ← Back
      </Link>
      <div>
        <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#1f6feb]">
          New post
        </p>
        <h1 className="text-2xl font-bold text-white">Facebook</h1>
      </div>
      <FacebookComposer />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(protected\)/marketing/components/facebook-composer.tsx app/admin/\(protected\)/marketing/new/facebook/page.tsx
git commit -m "feat(marketing): add Facebook composer page + form component"
```

---

## Task 10: YouTube composer client component + page

**Files:**
- Create: `app/admin/(protected)/marketing/components/youtube-composer.tsx`
- Create: `app/admin/(protected)/marketing/new/youtube/page.tsx`

- [ ] **Step 1: Write the client composer component**

Content of `app/admin/(protected)/marketing/components/youtube-composer.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createYouTubePost, schedulePost } from "../actions";

export function YouTubeComposer() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  function submit() {
    setError(null);
    if (!title.trim()) return setError("Add a title.");
    if (!file) return setError("Pick a video.");
    if (scheduleMode === "later" && !scheduleAt) return setError("Pick a date and time.");

    const formData = new FormData();
    formData.set("title", title);
    formData.set("body", description);
    formData.set("video", file);

    startTransition(async () => {
      const result = await createYouTubePost(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (scheduleMode === "later") {
        const scheduledAt = new Date(scheduleAt).toISOString();
        const scheduleResult = await schedulePost({ id: result.id, scheduledAt });
        if (!scheduleResult.ok) {
          setError(scheduleResult.error);
          return;
        }
        router.push(`/admin/marketing/${result.id}?scheduled=1`);
      } else {
        router.push(`/admin/marketing/${result.id}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          Title
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short, punchy title…"
          className="mt-2 w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="What's in the video…"
          className="mt-2 w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
        />
      </label>

      <label className="block rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          Video
        </span>
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          capture="environment"
          onChange={onFileChange}
          className="mt-3 block w-full text-sm text-[#9aafc5]"
        />
        {file && (
          <p className="mt-2 text-xs text-[#9aafc5]">
            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </label>

      <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4 space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          When
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode("now")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
              scheduleMode === "now"
                ? "border-[#1f6feb] bg-[#1f6feb] text-white"
                : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
            }`}
          >
            Upload now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("later")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
              scheduleMode === "later"
                ? "border-[#1f6feb] bg-[#1f6feb] text-white"
                : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
            }`}
          >
            Schedule
          </button>
        </div>
        {scheduleMode === "later" && (
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white focus:border-[#3a4e6e] focus:outline-none"
          />
        )}
      </div>

      {error && (
        <p className="rounded-md border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full min-h-12 rounded-md bg-[#1f6feb] px-4 py-3 text-base font-extrabold text-white hover:bg-[#1a5ed1] disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : scheduleMode === "later"
            ? "Schedule upload"
            : "Continue to share"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write the YT composer page**

Content of `app/admin/(protected)/marketing/new/youtube/page.tsx`:

```tsx
import Link from "next/link";
import { YouTubeComposer } from "../../components/youtube-composer";

export const dynamic = "force-dynamic";

export default function NewYouTubePostPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/admin/marketing"
        className="text-sm font-bold text-[#9aafc5] hover:text-white"
      >
        ← Back
      </Link>
      <div>
        <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#ff3b3b]">
          New upload
        </p>
        <h1 className="text-2xl font-bold text-white">YouTube</h1>
      </div>
      <YouTubeComposer />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(protected\)/marketing/components/youtube-composer.tsx app/admin/\(protected\)/marketing/new/youtube/page.tsx
git commit -m "feat(marketing): add YouTube composer page + form component"
```

---

## Task 11: Marketing posts list page (overwrites placeholder) + post-row component

**Files:**
- Modify (overwrite): `app/admin/(protected)/marketing/page.tsx`
- Create: `app/admin/(protected)/marketing/components/post-row.tsx`

- [ ] **Step 1: Write the post-row component**

Content of `app/admin/(protected)/marketing/components/post-row.tsx`:

```tsx
import Link from "next/link";
import type { MarketingPlatform, MarketingStatus } from "@/lib/marketing/schema";
import { platformLabel } from "@/lib/marketing/schema";

interface Props {
  id: string;
  platform: MarketingPlatform;
  status: MarketingStatus;
  title: string | null;
  body: string | null;
  scheduledAt: string | null;
  postedAt: string | null;
  updatedAt: string;
}

function statusBg(status: MarketingStatus): string {
  switch (status) {
    case "draft":
      return "bg-[#1a2c44]";
    case "scheduled":
      return "bg-[#1f6feb]";
    case "posted":
      return "bg-[#2a7a3a]";
    case "archived":
      return "bg-[#4a3a20]";
  }
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PostRow({
  id,
  platform,
  status,
  title,
  body,
  scheduledAt,
  postedAt,
  updatedAt,
}: Props) {
  const headline = title ?? (body ? body.slice(0, 80) : "Untitled");
  const when =
    status === "scheduled"
      ? formatDate(scheduledAt)
      : status === "posted"
        ? formatDate(postedAt)
        : formatDate(updatedAt);

  return (
    <Link
      href={`/admin/marketing/${id}`}
      className="flex items-center gap-3 rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 hover:bg-[#14253b]"
    >
      <span
        className={`rounded-sm px-2 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-white ${statusBg(
          status
        )}`}
      >
        {status}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{headline}</p>
        <p className="text-xs text-[#9aafc5]">
          {platformLabel(platform)}
          {when ? ` · ${when}` : ""}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Overwrite the placeholder page with the list**

Content of `app/admin/(protected)/marketing/page.tsx`:

```tsx
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PostRow } from "./components/post-row";

export const dynamic = "force-dynamic";

async function loadPosts() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("marketing_posts")
    .select("id, platform, status, title, body, scheduled_at, posted_at, updated_at")
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export default async function AdminMarketingPage() {
  const posts = await loadPosts();

  const drafts = posts.filter((p) => p.status === "draft");
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const posted = posts.filter((p) => p.status === "posted");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketing</h1>
        <p className="text-sm text-[#9aafc5]">Compose posts, schedule, and hand off to the app.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/admin/marketing/new/facebook"
          className="flex min-h-20 items-center justify-center gap-3 rounded-md bg-[#1f6feb] px-4 py-4 text-base font-extrabold text-white hover:bg-[#1a5ed1]"
        >
          + New Facebook post
        </Link>
        <Link
          href="/admin/marketing/new/youtube"
          className="flex min-h-20 items-center justify-center gap-3 rounded-md bg-[#c53030] px-4 py-4 text-base font-extrabold text-white hover:bg-[#a52626]"
        >
          + New YouTube upload
        </Link>
      </div>

      {scheduled.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
            Scheduled
          </h2>
          {scheduled.map((p) => (
            <PostRow
              key={p.id}
              id={p.id}
              platform={p.platform}
              status={p.status}
              title={p.title}
              body={p.body}
              scheduledAt={p.scheduled_at}
              postedAt={p.posted_at}
              updatedAt={p.updated_at}
            />
          ))}
        </section>
      )}

      {drafts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
            Drafts
          </h2>
          {drafts.map((p) => (
            <PostRow
              key={p.id}
              id={p.id}
              platform={p.platform}
              status={p.status}
              title={p.title}
              body={p.body}
              scheduledAt={p.scheduled_at}
              postedAt={p.posted_at}
              updatedAt={p.updated_at}
            />
          ))}
        </section>
      )}

      {posted.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
            Posted
          </h2>
          {posted.slice(0, 20).map((p) => (
            <PostRow
              key={p.id}
              id={p.id}
              platform={p.platform}
              status={p.status}
              title={p.title}
              body={p.body}
              scheduledAt={p.scheduled_at}
              postedAt={p.posted_at}
              updatedAt={p.updated_at}
            />
          ))}
        </section>
      )}

      {posts.length === 0 && (
        <p className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-6 text-center text-sm text-[#9aafc5]">
          No posts yet. Tap one of the buttons above to compose the first one.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(protected\)/marketing/page.tsx app/admin/\(protected\)/marketing/components/post-row.tsx
git commit -m "feat(marketing): replace placeholder with posts list and entry buttons"
```

---

## Task 12: Share launchpad client component

**Files:**
- Create: `app/admin/(protected)/marketing/components/share-launchpad.tsx`

- [ ] **Step 1: Write the component**

Content of `app/admin/(protected)/marketing/components/share-launchpad.tsx`:

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  canShareFiles,
  fetchAsFile,
  shareFiles,
} from "@/lib/marketing/share";
import {
  platformLabel,
  platformOpenUrl,
  type MarketingPlatform,
} from "@/lib/marketing/schema";
import { getSignedMediaUrl, markPosted, deletePost } from "../actions";

interface Props {
  postId: string;
  platform: MarketingPlatform;
  title: string | null;
  body: string | null;
  media: {
    storagePath: string;
    mimeType: string;
    fileName: string;
  };
}

export function ShareLaunchpad({ postId, platform, title, body, media }: Props) {
  const router = useRouter();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [pending, startTransition] = useTransition();

  const shareText =
    platform === "youtube" && title
      ? `${title}${body ? `\n\n${body}` : ""}`
      : body ?? "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getSignedMediaUrl({ storagePath: media.storagePath });
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setSignedUrl(result.url);
      // Probe if we CAN share — fetch the file only once we actually need to share.
      // We do a lightweight probe with an empty file to confirm navigator.canShare exists
      // and supports files. Actual fetch happens on button tap.
      const probe = new File([new Uint8Array([0])], media.fileName, {
        type: media.mimeType,
      });
      setCanShare(canShareFiles([probe]));
    })();
    return () => {
      cancelled = true;
    };
  }, [media.storagePath, media.fileName, media.mimeType]);

  async function onShare() {
    if (!signedUrl) return;
    try {
      const file = await fetchAsFile(signedUrl, media.fileName, media.mimeType);
      const ok = await shareFiles({ text: shareText, files: [file] });
      if (!ok) {
        // User cancelled or share failed — leave state alone; they can retry or fall back.
        return;
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Share failed.");
    }
  }

  function onCopyCaption() {
    navigator.clipboard.writeText(shareText).catch(() => {});
  }

  function onMarkPosted() {
    startTransition(async () => {
      const result = await markPosted({ id: postId });
      if (result.ok) router.push("/admin/marketing");
    });
  }

  function onDelete() {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deletePost({ id: postId });
      if (result.ok) router.push("/admin/marketing");
    });
  }

  return (
    <div className="space-y-4">
      {loadError && (
        <p className="rounded-md border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
          {loadError}
        </p>
      )}

      <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4 space-y-3">
        {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
        {body && <p className="whitespace-pre-wrap text-sm text-[#d7e2f0]">{body}</p>}
        {signedUrl ? (
          media.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt="Post media"
              className="max-h-96 w-auto rounded-md object-contain"
            />
          ) : (
            <video
              src={signedUrl}
              controls
              className="max-h-96 w-full rounded-md"
            />
          )
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md bg-[#07101c] text-sm text-[#9aafc5]">
            Loading media…
          </div>
        )}
      </div>

      {canShare ? (
        <button
          type="button"
          onClick={onShare}
          className="w-full min-h-14 rounded-md bg-[#1f6feb] px-4 py-3 text-base font-extrabold text-white hover:bg-[#1a5ed1]"
        >
          Share to {platformLabel(platform)}
        </button>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onCopyCaption}
            className="w-full min-h-12 rounded-md bg-[#1a2c44] px-4 py-3 text-sm font-extrabold text-white border border-[#25344a] hover:bg-[#243654]"
          >
            Copy caption
          </button>
          {signedUrl && (
            <a
              href={signedUrl}
              download={media.fileName}
              className="flex w-full min-h-12 items-center justify-center rounded-md bg-[#1a2c44] px-4 py-3 text-sm font-extrabold text-white border border-[#25344a] hover:bg-[#243654]"
            >
              Download media
            </a>
          )}
          <a
            href={platformOpenUrl(platform)}
            target="_blank"
            rel="noreferrer"
            className="flex w-full min-h-12 items-center justify-center rounded-md bg-[#1f6feb] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#1a5ed1]"
          >
            Open {platformLabel(platform)}
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onMarkPosted}
          disabled={pending}
          className="flex-1 min-h-12 rounded-md bg-[#2a7a3a] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#236432] disabled:opacity-60"
        >
          {pending ? "…" : "I posted it"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="flex-1 min-h-12 rounded-md bg-[#1a2c44] px-4 py-3 text-sm font-extrabold text-white border border-[#25344a] hover:bg-[#5a1a1a]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(protected\)/marketing/components/share-launchpad.tsx
git commit -m "feat(marketing): add share launchpad with Web Share + desktop fallback"
```

---

## Task 13: Post detail / launchpad page

**Files:**
- Create: `app/admin/(protected)/marketing/[id]/page.tsx`

- [ ] **Step 1: Write the page**

Content of `app/admin/(protected)/marketing/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isPlatform } from "@/lib/marketing/schema";
import { ShareLaunchpad } from "../components/share-launchpad";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scheduled?: string }>;
}

export default async function MarketingPostPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { scheduled } = await searchParams;

  const admin = createSupabaseAdminClient();
  const { data: post } = await admin
    .from("marketing_posts")
    .select(
      "id, platform, status, title, body, scheduled_at, posted_at, marketing_post_media(storage_path, mime_type)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!post || !isPlatform(post.platform)) {
    notFound();
  }

  const media = Array.isArray(post.marketing_post_media) ? post.marketing_post_media[0] : null;

  if (!media) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Link href="/admin/marketing" className="text-sm font-bold text-[#9aafc5] hover:text-white">
          ← Back
        </Link>
        <p className="rounded-md border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
          This post is missing its media. Delete it and recompose.
        </p>
      </div>
    );
  }

  const fileName = media.storage_path.split("/").pop() ?? "media";

  const scheduledBanner =
    scheduled === "1" && post.scheduled_at
      ? `Scheduled for ${new Date(post.scheduled_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}. We'll email you when it's time.`
      : null;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin/marketing" className="text-sm font-bold text-[#9aafc5] hover:text-white">
        ← Back
      </Link>

      {scheduledBanner && (
        <p className="rounded-md border border-[#25344a] bg-[#1a2c44] p-3 text-sm text-white">
          {scheduledBanner}
        </p>
      )}

      <div>
        <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
          {post.status}
        </p>
        <h1 className="text-2xl font-bold text-white">
          {post.platform === "facebook" ? "Facebook" : "YouTube"}
        </h1>
      </div>

      <ShareLaunchpad
        postId={post.id}
        platform={post.platform}
        title={post.title}
        body={post.body}
        media={{
          storagePath: media.storage_path,
          mimeType: media.mime_type,
          fileName,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(protected\)/marketing/\[id\]/page.tsx
git commit -m "feat(marketing): add post detail + launchpad page"
```

---

## Task 14: Cron route for marketing reminders + `vercel.json`

**Files:**
- Create: `app/api/cron/marketing-reminders/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Write the cron handler**

Content of `app/api/cron/marketing-reminders/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

const DEFAULT_RECIPIENT = "doublelehvac@gmail.com";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "https://www.double-le-hvac.com";
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await admin
    .from("marketing_posts")
    .select("id, platform, title, body, scheduled_at")
    .eq("status", "scheduled")
    .is("reminded_at", null)
    .lte("scheduled_at", nowIso)
    .limit(50);

  if (error) {
    console.error("[cron/marketing-reminders] query error:", error.message);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim() || DEFAULT_RECIPIENT;
  const origin = siteOrigin();
  let sent = 0;
  let failed = 0;

  for (const post of due ?? []) {
    const headline =
      post.title ??
      (post.body ? post.body.slice(0, 60) : null) ??
      (post.platform === "facebook" ? "Facebook post" : "YouTube upload");
    const link = `${origin}/admin/marketing/${post.id}`;
    const subject = `Time to post: ${headline}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12202f;">
        <h2 style="margin-bottom: 12px;">Time to post</h2>
        <p>Your scheduled ${post.platform === "facebook" ? "Facebook post" : "YouTube upload"} is ready.</p>
        <p><strong>${headline}</strong></p>
        <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#1f6feb;color:#fff;border-radius:6px;text-decoration:none;font-weight:700;">Open launchpad</a></p>
        <p style="color:#6c8096;font-size:12px;">Or visit: ${link}</p>
      </div>
    `;
    const text = `Time to post: ${headline}\n\nOpen launchpad: ${link}`;

    const result = await sendEmail({ to: recipient, subject, html, text });
    if (result.sent) {
      await admin
        .from("marketing_posts")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", post.id);
      sent++;
    } else {
      console.error("[cron/marketing-reminders] send failed:", result.error ?? result.skipped);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: due?.length ?? 0 });
}
```

- [ ] **Step 2: Write `vercel.json`**

Content of `vercel.json` (new file at repo root):

```json
{
  "crons": [
    {
      "path": "/api/cron/marketing-reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Add `CRON_SECRET` to `.env.example`**

Open `.env.example` and append:

```
# Used by /api/cron/marketing-reminders to validate Vercel Cron requests.
# Generate a random value and set the same value in Vercel project env.
CRON_SECRET=
```

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/marketing-reminders/route.ts vercel.json .env.example
git commit -m "feat(marketing): add scheduled-post reminder cron + vercel.json"
```

- [ ] **Step 6: Post-commit — set `CRON_SECRET` on Vercel (manual)**

Run: in the Vercel dashboard → Project → Settings → Environment Variables → add `CRON_SECRET` for Production and Preview with a random value (e.g., from `openssl rand -hex 24`). Then redeploy the project (or wait for the next push to trigger a deploy). This is a one-time manual step outside the code.

---

## Task 15: Unlock the Marketing nav entry

**Files:**
- Modify: `components/admin/admin-nav.tsx`

- [ ] **Step 1: Remove `disabled: true` from the Marketing nav item**

Open `components/admin/admin-nav.tsx`. Change line 9:

From:
```ts
  { href: "/admin/marketing", label: "Marketing", disabled: true },
```

To:
```ts
  { href: "/admin/marketing", label: "Marketing" },
```

No other changes to the file.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/admin-nav.tsx
git commit -m "feat(admin-nav): unlock Marketing tab now that composer is live"
```

---

## Task 16: Manual smoke test + final verification

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`
Expected: server listens (usually on 3000). No build errors.

- [ ] **Step 2: Sign in to admin**

Open `http://localhost:3000/admin/login` in a browser, sign in. Click the **Marketing** tab in the nav — it should no longer say "Soon" and should load the posts list (empty initially).

- [ ] **Step 3: Compose a Facebook post ("Post now")**

1. Tap **+ New Facebook post**
2. Pick an image (any jpg/png/webp under 10 MB)
3. Type a test caption
4. Leave "Post now" selected → **Continue to share**
5. Expected: redirects to `/admin/marketing/<id>` launchpad. Caption + image preview visible.
6. On desktop Chrome, Web Share API with files is unsupported → Copy caption / Download media / Open Facebook fallback appears.
7. On iPhone Safari (or BrowserStack iOS), a single **Share to Facebook** button appears. Tapping it opens the iOS share sheet with image attached and caption pre-filled.
8. Tap **I posted it** → redirects to list; post appears under "Posted".

- [ ] **Step 4: Compose a YouTube upload**

Same as Step 3 with the YouTube flow — title + description + MP4 video ≤50 MB.

- [ ] **Step 5: Schedule a post 2 minutes in the future (local test)**

1. New Facebook post → fill in → **Schedule** → pick a time 2 min ahead → **Schedule post**.
2. Status should be "scheduled" in the list.
3. Locally you cannot trigger Vercel Cron, so simulate by hitting the cron route with the secret:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/marketing-reminders
   ```
4. After `scheduled_at`, running the curl should return `{"ok":true,"sent":1,"failed":0,"total":1}` and an email should arrive at `doublelehvac@gmail.com` within a minute.

(For local dev, `CRON_SECRET` must be set in `.env.local`.)

- [ ] **Step 6: Verify size limits**

Try uploading a >10 MB image in the FB composer → expect a friendly error.
Try uploading a >50 MB video in the YouTube composer → expect a friendly error.

- [ ] **Step 7: Verify delete cleans up media**

Delete a draft post from the launchpad. Check Supabase Storage → `marketing-media` bucket. Confirm the corresponding file is gone.

- [ ] **Step 8: No commit for this task — testing only**

If any step fails, fix in-place and commit a patch under the task that owns it.

---

## Self-review checklist

Run through before declaring done:

- [ ] Every `marketing_posts` column in the migration has a matching type in `database.types.ts`.
- [ ] Every server action returns `ActionResult<T>`.
- [ ] Every page that queries the DB has `export const dynamic = "force-dynamic";`.
- [ ] All admin routes are under `(protected)` and inherit `requireAdminSession()` via the existing layout — no per-page auth check needed beyond the server-action `requireSession()`.
- [ ] `CRON_SECRET` is documented in `.env.example` and a reminder to set it in Vercel is in Task 14.
- [ ] `vercel.json` exists at repo root and has exactly one cron entry.
- [ ] `components/admin/admin-nav.tsx` has the Marketing tab active.
- [ ] Contact form still sends email via the new `sendEmail` helper (regression).
- [ ] No mocked types, no TODO comments, no unused imports (run `pnpm lint`).
- [ ] All tasks committed individually.
