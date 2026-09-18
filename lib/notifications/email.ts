interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  sent: boolean;
  skipped?: "unconfigured";
  error?: string;
}

const DEFAULT_FROM = "Double Le HVAC <onboarding@resend.dev>";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, skipped: "unconfigured" };
  }

  const body = {
    from: input.from ?? process.env.CONTACT_FROM_EMAIL?.trim() ?? DEFAULT_FROM,
    to: Array.isArray(input.to) ? input.to : [input.to],
    reply_to: input.replyTo,
    subject: input.subject,
    html: input.html,
    text: input.text,
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        sent: false,
        error: `Resend ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown Resend error",
    };
  }
}
