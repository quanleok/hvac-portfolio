import { NextRequest } from "next/server";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { ok, unauthorized } from "@/lib/api/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMarketingJobStatus, isMarketingJobType } from "@/lib/marketing/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const url = request.nextUrl;
  const status = url.searchParams.get("status");
  const jobType = url.searchParams.get("job_type");
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "25", 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 25;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("marketing_agent_jobs")
    .select("id, campaign_id, post_id, job_type, status, priority, input, output, error, attempts, locked_at, locked_by, completed_at, created_at, updated_at")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (status && isMarketingJobStatus(status)) query = query.eq("status", status);
  if (jobType && isMarketingJobType(jobType)) query = query.eq("job_type", jobType);

  const { data: jobs, error } = await query;
  if (error) return ok({ jobs: [], posts: [], error: error.message });

  const postIds = Array.from(new Set((jobs ?? []).map((job) => job.post_id).filter(Boolean))) as string[];
  const { data: posts } = postIds.length
    ? await admin
        .from("marketing_posts")
        .select("id, campaign_id, campaign_name, platform, status, title, body, workflow, scheduled_at, posted_at, updated_at")
        .in("id", postIds)
    : { data: [] };

  return ok({
    jobs: jobs ?? [],
    posts: posts ?? [],
  });
}
