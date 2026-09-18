import { NextRequest } from "next/server";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordMarketingEvent } from "@/lib/marketing/automation";
import { isStatus } from "@/lib/marketing/schema";
import type { Json, MarketingPostUpdate } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(request: NextRequest, { params }: Props) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!id) return err("Missing job id.");

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const admin = createSupabaseAdminClient();
  const { data: job, error: fetchError } = await admin
    .from("marketing_agent_jobs")
    .select("id, campaign_id, post_id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return err(fetchError.message, 500);
  if (!job) return err("Job not found.", 404);

  const now = new Date().toISOString();
  const output = (isRecord(body.output) ? body.output : {}) as Json;
  const { error: updateError } = await admin
    .from("marketing_agent_jobs")
    .update({
      status: "completed",
      output,
      error: null,
      completed_at: now,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", id);

  if (updateError) return err(updateError.message, 500);

  if (job.post_id) {
    const { data: post } = await admin
      .from("marketing_posts")
      .select("id, status, workflow")
      .eq("id", job.post_id)
      .maybeSingle();

    const postUpdates = isRecord(body.post_updates) ? body.post_updates : {};
    const update: MarketingPostUpdate = {};
    if (typeof postUpdates.title === "string") update.title = postUpdates.title.trim() || null;
    if (typeof postUpdates.body === "string") update.body = postUpdates.body.trim() || null;
    if (typeof postUpdates.scheduled_at === "string") update.scheduled_at = postUpdates.scheduled_at;
    if (typeof postUpdates.status === "string" && isStatus(postUpdates.status)) {
      update.status = postUpdates.status;
    } else if (post?.status === "needs_ai") {
      update.status = "ready";
    }

    const nextWorkflow =
      isRecord(post?.workflow) || isRecord(postUpdates.workflow)
        ? {
            ...(isRecord(post?.workflow) ? post.workflow : {}),
            ...(isRecord(postUpdates.workflow) ? postUpdates.workflow : {}),
            queueState: "ready",
            automationCompletedAt: now,
          }
        : {
            queueState: "ready",
            automationCompletedAt: now,
          };
    update.workflow = nextWorkflow as Json;

    await admin.from("marketing_posts").update(update).eq("id", job.post_id);
  }

  await recordMarketingEvent(admin, {
    campaign_id: job.campaign_id,
    post_id: job.post_id,
    actor: ctx.tokenName,
    event_type: "job_completed",
    event_data: { jobId: id, output },
  });

  return ok({ id, status: "completed", completed_at: now });
}
