import { NextRequest } from "next/server";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { sendExistingMarketingPost } from "@/lib/marketing/api-posting";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!id) return err("Missing post id.");

  let body: { scheduled_at?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const scheduledAt = typeof body.scheduled_at === "string" ? body.scheduled_at : null;
  const result = await sendExistingMarketingPost({
    id,
    actor: ctx.tokenName,
    scheduledAt,
  });

  if (!result.ok) return err(result.error, result.status ?? 400);
  return ok({
    id: result.id,
    platform: result.platform,
    status: result.status,
    scheduled_at: result.scheduled_at,
    posted_at: result.posted_at,
  });
}
