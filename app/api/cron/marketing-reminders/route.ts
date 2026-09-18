import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { platformLabel } from "@/lib/marketing/schema";
import { sendEmail } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

const DEFAULT_RECIPIENT = "doublelehvac@gmail.com";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "https://www.double-le-hvac.com";
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await admin
    .from("marketing_posts")
    .select("id, campaign_name, platform, title, body, scheduled_at")
    .eq("status", "scheduled")
    .is("reminded_at", null)
    .lte("scheduled_at", nowIso)
    .limit(50);

  if (error) {
    console.error("[cron/marketing-reminders] query error:", error.message);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim() || DEFAULT_RECIPIENT;
  const origin = siteOrigin();
  let sent = 0;
  let failed = 0;

  for (const post of due ?? []) {
    const headline =
      post.campaign_name ??
      post.title ??
      (post.body ? post.body.slice(0, 60) : null) ??
      `${platformLabel(post.platform)} queue item`;
    const link = `${origin}/admin/marketing/${post.id}`;
    const subject = `Time to post: ${headline}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12202f;">
        <h2 style="margin-bottom: 12px;">Time to post</h2>
        <p>Your scheduled ${platformLabel(post.platform)} queue item is ready.</p>
        <p><strong>${headline}</strong></p>
        <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#1f6feb;color:#fff;border-radius:6px;text-decoration:none;font-weight:700;">Open launchpad</a></p>
        <p style="color:#6c8096;font-size:12px;">Or visit: ${link}</p>
      </div>
    `;
    const text = `Time to post: ${headline}\n\nOpen launchpad: ${link}`;

    const result = await sendEmail({ to: recipient, subject, html, text });
    if (result.sent) {
      await admin
        .from("marketing_posts")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", post.id);
      sent++;
    } else {
      console.error("[cron/marketing-reminders] send failed:", result.error ?? result.skipped);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: due?.length ?? 0 });
}
