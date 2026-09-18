import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";
import { sendSms } from "@/lib/notifications/sms";
import { sendPush } from "@/lib/notifications/push";
import { sendEmail } from "@/lib/notifications/email";
import { isValidPromoCode } from "@/lib/promo/rotation";

const DEFAULT_CONTACT_RECIPIENT = "doublelehvac@gmail.com";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const promoCode = typeof body.promoCode === "string" ? body.promoCode.trim() : "";
  const discountApplied = promoCode ? isValidPromoCode(promoCode) : false;

  if (company) {
    return NextResponse.json({ success: true });
  }

  if (!name || !phone || !message) {
    return NextResponse.json(
      { error: "Please fill out your name, phone number, and message." },
      { status: 400 }
    );
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const submittedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const leadNote = [
    discountApplied ? `Discount code applied: ${promoCode} — $500 off on install.` : null,
    `Website request submitted ${submittedAt}.`,
    email ? `Email: ${email}` : null,
    city ? `City: ${city}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  let leadCaptured = false;

  if (hasSupabaseServiceRoleKey()) {
    try {
      const supabase = createSupabaseAdminClient();
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name,
          phone,
          email: email || null,
          city: city || null,
          source: "website",
          status: "lead",
        })
        .select("id")
        .single();

      if (clientError) {
        console.error("[contact] supabase lead insert error:", clientError.message);
      } else if (client?.id) {
        leadCaptured = true;

        const { error: noteError } = await supabase.from("notes").insert({
          client_id: client.id,
          note_text: leadNote,
        });

        if (noteError) {
          console.error("[contact] supabase note insert error:", noteError.message);
        }
      }
    } catch (error) {
      console.error("[contact] supabase error:", error);
    }
  }

  const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim() || DEFAULT_CONTACT_RECIPIENT;

  const subject = discountApplied
    ? `[DISCOUNT APPLIED] New website request from ${name}`
    : `New website request from ${name}`;

  const discountBanner = discountApplied
    ? `<div style="margin-bottom: 20px; padding: 14px 16px; background: #c53030; border-radius: 6px; color: #fff; font-weight: 700;">
      Discount code applied: <code style="background: #fff; color: #c53030; padding: 2px 6px; border-radius: 3px;">${promoCode}</code> — $500 off on install
     </div>`
    : "";

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12202f;">
    ${discountBanner}
    <h2 style="margin-bottom: 12px;">New website request</h2>
    <p style="margin: 0 0 16px;">A customer filled out the Double Le HVAC website form.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
      <tr><td style="padding: 8px 0; font-weight: 700;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">Email</td><td style="padding: 8px 0;">${email || "Not provided"}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">City</td><td style="padding: 8px 0;">${city || "Not provided"}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 700;">Submitted</td><td style="padding: 8px 0;">${submittedAt}</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 16px; border-radius: 12px; background: #f3f6f9;">
      <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
      <p style="margin: 0; white-space: pre-wrap;">${message}</p>
    </div>
  </div>
`;

  const text = [
    discountApplied ? `DISCOUNT APPLIED — code ${promoCode} — $500 off install` : null,
    "New website request",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email || "Not provided"}`,
    `City: ${city || "Not provided"}`,
    `Submitted: ${submittedAt}`,
    "",
    "Message:",
    message,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const emailResult = await sendEmail({
    to: recipient,
    subject,
    html,
    text,
    replyTo: email || undefined,
  });

  const emailSent = emailResult.sent;
  if (!emailResult.sent && emailResult.error) {
    console.error("[contact] email error:", emailResult.error);
  }

  const smsBody = [
    `Double Le Heat and Air — Lead Notification`,
    discountApplied ? `$500 OFF — code ${promoCode}` : null,
    `${name} · ${phone}`,
    city ? `City: ${city}` : null,
    email ? `Email: ${email}` : null,
    "",
    message.length > 180 ? `${message.slice(0, 177)}...` : message,
    "",
    `Reply STOP to opt out · HELP for help`,
  ]
    .filter(Boolean)
    .join("\n");

  const [smsResult, pushResult] = await Promise.all([
    sendSms({ body: smsBody }),
    sendPush({
      title: discountApplied
        ? `$500 OFF lead — ${name}`
        : `Double Le HVAC lead — ${name}`,
      message: smsBody,
    }),
  ]);
  if (!smsResult.sent && smsResult.error) {
    console.error("[contact] twilio error:", smsResult.error);
  }
  if (!pushResult.sent && pushResult.error) {
    console.error("[contact] pushover error:", pushResult.error);
  }

  if (!emailSent && !leadCaptured) {
    return NextResponse.json(
      {
        error:
          "Online request form is still being configured. Please call (405) 361-5014 for now.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true, discountApplied });
}
