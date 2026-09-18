import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { TokenCreator } from "./token-creator";
import { TokenList } from "./token-list";

export const dynamic = "force-dynamic";

async function loadTokens() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("service_tokens")
    .select("id, name, token_prefix, created_at, last_used_at, is_active")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function ApiTokensPage() {
  const tokens = await loadTokens();
  const active = tokens.filter((t) => t.is_active);
  const revoked = tokens.filter((t) => !t.is_active);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Marketing", href: "/admin/marketing" },
          { label: "API tokens" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">API tokens</h1>
        <p className="text-sm text-[#9aafc5]">
          Long-lived bearer tokens for external agents such as your future OpenClaw worker. Each
          token is shown once on creation — store it somewhere safe.
        </p>
      </div>

      <TokenCreator />

      {active.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
            Active
          </h2>
          <TokenList
            tokens={active.map((t) => ({
              id: t.id,
              name: t.name,
              prefix: t.token_prefix,
              createdAt: t.created_at,
              lastUsedAt: t.last_used_at,
            }))}
          />
        </section>
      )}

      {revoked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
            Revoked
          </h2>
          <ul className="space-y-2">
            {revoked.map((t) => (
              <li
                key={t.id}
                className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 opacity-60"
              >
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-xs text-[#9aafc5]">
                  {t.token_prefix}… · revoked
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tokens.length === 0 && (
        <p className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-6 text-center text-sm text-[#9aafc5]">
          No tokens yet. Create one above to let an external agent call the Marketing API.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
          API reference
        </h2>
        <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4 space-y-3 text-xs text-[#d7e2f0]">
          <p className="text-sm font-bold text-white">Auth</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`Authorization: Bearer dlhvac_…`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">Compose Facebook post</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`POST /api/v1/marketing/posts/facebook
Content-Type: application/json

{
  "caption": "Real job, real cool air.",
  "image_url": "https://your-cdn.com/photo.jpg"
}`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">Create, send, or schedule a marketing post</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`POST /api/v1/marketing/posts
Content-Type: application/json

{
  "platforms": ["facebook", "youtube"],
  "action": "post_now",
  "title": "New install walkthrough",
  "body": "Fresh install finished today. Call or text to get on the schedule.",
  "media": {
    "kind": "video",
    "url": "https://agent-output.com/install.mp4"
  }
}`}
          </pre>

          <p className="text-xs text-[#9aafc5]">
            Use <code>{`"action": "save"`}</code> to save locally,{" "}
            <code>{`"action": "post_now"`}</code> to publish through Buffer now, or{" "}
            <code>{`"action": "schedule_later"`}</code> with <code>scheduled_at</code> to schedule
            through Buffer where the channel is connected.
          </p>

          <p className="text-sm font-bold text-white pt-2">Compose YouTube upload</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`POST /api/v1/marketing/posts/youtube
Content-Type: application/json

{
  "title": "New AC install walkthrough",
  "description": "Quick rundown of today's install.",
  "video_url": "https://your-cdn.com/install.mp4"
}`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">Schedule an existing post</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`POST /api/v1/marketing/posts/:id/schedule
Content-Type: application/json

{ "scheduled_at": "2026-05-01T15:00:00Z" }`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">Send an existing post through Buffer</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`POST /api/v1/marketing/posts/:id/send
Content-Type: application/json

{}

// Or schedule through Buffer:
{ "scheduled_at": "2026-05-01T15:00:00Z" }`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">Mark as posted</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`POST /api/v1/marketing/posts/:id/publish`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">List posts</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`GET /api/v1/marketing/posts?status=scheduled&platform=email&limit=10`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">OpenClaw jobs</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`GET  /api/v1/marketing/jobs?status=queued
POST /api/v1/marketing/jobs/:id/start
POST /api/v1/marketing/posts/:id/assets
POST /api/v1/marketing/posts/:id/send
POST /api/v1/marketing/jobs/:id/complete
POST /api/v1/marketing/jobs/:id/fail`}
          </pre>

          <p className="text-sm font-bold text-white pt-2">Attach generated media</p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3">
{`POST /api/v1/marketing/posts/:id/assets
Content-Type: application/json

{
  "kind": "image",
  "media_url": "https://agent-output.com/ad.png",
  "label": "OpenClaw generated image"
}`}
          </pre>

          <p className="text-xs text-[#9aafc5]">
            The list endpoint now returns queue metadata such as <code>campaign_id</code>,{" "}
            <code>campaign_name</code>, and <code>workflow</code> so an external worker can decide
            what media to generate, where to post, and when to push it live. OpenClaw should claim
            jobs first, attach generated assets, send or schedule through <code>/send</code> when
            requested, then mark the job complete.
          </p>
        </div>
      </section>
    </div>
  );
}
