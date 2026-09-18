import { NextRequest } from "next/server";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordMarketingEvent } from "@/lib/marketing/automation";
import { isStatus, type MarketingStatus } from "@/lib/marketing/schema";
import type { Json, MarketingPostUpdate } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!id) return err("Missing post id.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return err("Invalid JSON body.");
  }

  const admin = createSupabaseAdminClient();
  const { data: current, error: fetchError } = await admin
    .from("marketing_posts")
    .select("id, campaign_id, workflow")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return err(fetchError.message, 500);
  if (!current) return err("Post not found.", 404);

  const update: MarketingPostUpdate = {};
  if (typeof body.title === "string") update.title = body.title.trim() || null;
  if (typeof body.body === "string") update.body = body.body.trim() || null;
  if (typeof body.status === "string" && isStatus(body.status)) {
    update.status = body.status as MarketingStatus;
  }
  if (typeof body.scheduled_at === "string") {
    const scheduledAt = new Date(body.scheduled_at);
    if (Number.isNaN(scheduledAt.getTime())) return err("Invalid 'scheduled_at'.");
    update.scheduled_at = scheduledAt.toISOString();
  }
  if (isRecord(body.workflow)) {
    update.workflow = {
      ...(isRecord(current.workflow) ? current.workflow : {}),
      ...body.workflow,
    } as Json;
  }

  if (Object.keys(update).length === 0) return err("No supported fields to update.");

  const { error } = await admin.from("marketing_posts").update(update).eq("id", id);
  if (error) return err(error.message, 500);

  await recordMarketingEvent(admin, {
    campaign_id: current.campaign_id,
    post_id: id,
    actor: ctx.tokenName,
    event_type: "post_updated",
    event_data: {
      fields: Object.keys(update),
    },
  });

  return ok({ id, updated: Object.keys(update) });
}
