import { NextRequest } from "next/server";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordMarketingEvent } from "@/lib/marketing/automation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!id) return err("Missing job id.");

  const admin = createSupabaseAdminClient();
  const { data: job, error: fetchError } = await admin
    .from("marketing_agent_jobs")
    .select("id, campaign_id, post_id, status, attempts")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return err(fetchError.message, 500);
  if (!job) return err("Job not found.", 404);
  if (job.status !== "queued" && job.status !== "failed") {
    return err(`Job is ${job.status}; only queued or failed jobs can be started.`);
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("marketing_agent_jobs")
    .update({
      status: "running",
      locked_at: now,
      locked_by: ctx.tokenName,
      attempts: job.attempts + 1,
      error: null,
    })
    .eq("id", id);

  if (error) return err(error.message, 500);

  await recordMarketingEvent(admin, {
    campaign_id: job.campaign_id,
    post_id: job.post_id,
    actor: ctx.tokenName,
    event_type: "job_started",
    event_data: { jobId: id },
  });

  return ok({ id, status: "running", locked_at: now });
}
