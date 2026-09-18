interface SendSmsInput {
  body: string;
  to?: string;
}

interface SendSmsResult {
  sent: boolean;
  skipped?: "unconfigured" | "no-recipient";
  error?: string;
}

export async function sendSms({ body, to }: SendSmsInput): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
  const recipient = (to ?? process.env.CONTACT_SMS_TO)?.trim();

  if (!accountSid || !authToken || !fromNumber) {
    return { sent: false, skipped: "unconfigured" };
  }

  if (!recipient) {
    return { sent: false, skipped: "no-recipient" };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.set("From", fromNumber);
  params.set("To", recipient);
  params.set("Body", body);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        sent: false,
        error: `Twilio ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown Twilio error",
    };
  }
}
