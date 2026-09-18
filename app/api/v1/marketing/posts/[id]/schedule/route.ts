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

  let body: { scheduled_at?: unknown };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.");
  }

  const scheduledAtInput = typeof body.scheduled_at === "string" ? body.scheduled_at.trim() : "";
  if (!scheduledAtInput) return err("Missing 'scheduled_at'.");

  const scheduledAt = new Date(scheduledAtInput);
  if (Number.isNaN(scheduledAt.getTime())) return err("Invalid 'scheduled_at' ISO string.");
  if (scheduledAt.getTime() < Date.now() - 60_000) {
    return err("'scheduled_at' is in the past.");
  }

  const admin = createSupabaseAdminClient();
  const { data: post } = await admin
    .from("marketing_posts")
    .select("id, campaign_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin
    .from("marketing_posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
      reminded_at: null,
    })
    .eq("id", id);

  if (error) return err(error.message, 500);
  if (post) {
    await recordMarketingEvent(admin, {
      campaign_id: post.campaign_id,
      post_id: id,
      actor: ctx.tokenName,
      event_type: "post_scheduled",
      event_data: { scheduledAt: scheduledAt.toISOString() },
    });
  }
  return ok({ id, scheduled_at: scheduledAt.toISOString() });
}
