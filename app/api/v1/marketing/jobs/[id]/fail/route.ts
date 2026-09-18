import { NextRequest } from "next/server";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordMarketingEvent } from "@/lib/marketing/automation";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!id) return err("Missing job id.");

  let body: { error?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const message =
    typeof body.error === "string" && body.error.trim()
      ? body.error.trim()
      : "Automation failed.";

  const admin = createSupabaseAdminClient();
  const { data: job, error: fetchError } = await admin
    .from("marketing_agent_jobs")
    .select("id, campaign_id, post_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return err(fetchError.message, 500);
  if (!job) return err("Job not found.", 404);

  const { error } = await admin
    .from("marketing_agent_jobs")
    .update({
      status: "failed",
      error: message,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", id);

  if (error) return err(error.message, 500);

  if (job.post_id) {
    const { data: post } = await admin
      .from("marketing_posts")
      .select("workflow")
      .eq("id", job.post_id)
      .maybeSingle();

    await admin
      .from("marketing_posts")
      .update({
        status: "failed",
        workflow: {
          ...(post?.workflow && typeof post.workflow === "object" && !Array.isArray(post.workflow)
            ? post.workflow
            : {}),
          queueState: "failed",
          automationError: message,
        } as Json,
      })
      .eq("id", job.post_id);
  }

  await recordMarketingEvent(admin, {
    campaign_id: job.campaign_id,
    post_id: job.post_id,
    actor: ctx.tokenName,
    event_type: "job_failed",
    event_data: { jobId: id, error: message },
  });

  return ok({ id, status: "failed", error: message });
}
