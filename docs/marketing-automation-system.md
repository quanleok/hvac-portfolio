# Marketing Automation System

## Source Of Truth

Marketing Studio is the owner workflow. AI Studio is an asset generator that feeds Marketing Studio, not a separate posting system.

## Workflow

1. Owner creates one campaign.
2. Owner selects one or more channels: Facebook, SMS, Email, TikTok, YouTube.
3. Owner writes the offer, call to action, post copy, and optional AI brief once.
4. Owner picks media mode: library, upload, generate now, queue for AI/OpenClaw, or text only.
5. System creates one `marketing_posts` row per platform and one `marketing_campaigns` parent row.
6. If AI/OpenClaw is needed, system creates one `marketing_agent_jobs` row per platform item.
7. OpenClaw claims queued jobs, creates or adapts media/copy, attaches assets, and marks jobs complete.
8. Owner reviews saved posts, or OpenClaw sends/schedules connected social posts through the service API.

## Tables

- `marketing_campaigns`: parent campaign intent, selected channels, template, offer, CTA, notes, and schedule intent.
- `marketing_posts`: channel-specific queue item and launchpad source.
- `marketing_post_media`: compatibility table for the existing launchpad.
- `marketing_assets`: canonical record of uploaded, library, AI, or OpenClaw media.
- `marketing_agent_jobs`: OpenClaw work queue.
- `marketing_events`: audit log for campaign/post/job actions.
- `marketing_accounts`: connected social accounts and OAuth tokens.
- `service_tokens`: hashed API tokens for trusted external agents.

## OpenClaw API Contract

Use `Authorization: Bearer dlhvac_...`.

- `GET /api/v1/marketing/jobs?status=queued`
- `POST /api/v1/marketing/jobs/:id/start`
- `POST /api/v1/marketing/posts` with `action: "save" | "post_now" | "schedule_later"`
- `POST /api/v1/marketing/posts/:id/assets`
- `POST /api/v1/marketing/posts/:id/send`
- `PATCH /api/v1/marketing/posts/:id`
- `POST /api/v1/marketing/jobs/:id/complete`
- `POST /api/v1/marketing/jobs/:id/fail`

OpenClaw should never write directly to Supabase. It should use the service API so events, status, and asset records stay consistent.

## Publishing Policy

Buffer is the direct-send layer for connected social channels. `post_now` uses Buffer `shareNow`; `schedule_later` uses Buffer `customScheduled`. SMS and Email remain manual copy/open/send channels, and unconnected social channels stay saved locally with warnings in the API response.
