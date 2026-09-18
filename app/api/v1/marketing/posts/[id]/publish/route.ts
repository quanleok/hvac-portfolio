import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { ok, err, unauthorized } from "@/lib/api/response";
import { recordMarketingEvent } from "@/lib/marketing/automation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!id) return err("Missing post id.");

  const admin = createSupabaseAdminClient();
  const { data: post, error: fetchError } = await admin
    .from("marketing_posts")
    .select("id, campaign_id, status")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return err(fetchError.message, 500);
  if (!post) return err("Post not found.", 404);

  // Phase 3 v1: no auto-publish via Graph API yet. We record that the post was
  // "completed" via the API — typically after the external agent manually
  // pushed the content through the native share flow. Once Phase 1b approvals
  // land, replace this with a Graph API call when a connected account exists.
  const { error: updateError } = await admin
    .from("marketing_posts")
    .update({
      status: "posted",
      posted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return err(updateError.message, 500);

  await recordMarketingEvent(admin, {
    campaign_id: post.campaign_id,
    post_id: id,
    actor: ctx.tokenName,
    event_type: "post_marked_posted",
    event_data: { previousStatus: post.status },
  });

  return ok({
    id,
    status: "posted",
    note: "Recorded as posted. Auto-publish via platform APIs is pending OAuth review; this endpoint currently only marks completion.",
  });
}
