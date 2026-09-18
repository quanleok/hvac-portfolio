interface SendPushInput {
  message: string;
  title?: string;
  url?: string;
  urlTitle?: string;
}

interface SendPushResult {
  sent: boolean;
  skipped?: "unconfigured";
  error?: string;
}

export async function sendPush({
  message,
  title,
  url,
  urlTitle,
}: SendPushInput): Promise<SendPushResult> {
  const token = process.env.PUSHOVER_TOKEN?.trim();
  const user = process.env.PUSHOVER_USER_KEY?.trim();

  if (!token || !user) {
    return { sent: false, skipped: "unconfigured" };
  }

  const params = new URLSearchParams();
  params.set("token", token);
  params.set("user", user);
  params.set("message", message.slice(0, 1024));
  if (title) params.set("title", title.slice(0, 250));
  if (url) params.set("url", url.slice(0, 512));
  if (urlTitle) params.set("url_title", urlTitle.slice(0, 100));

  try {
    const response = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        sent: false,
        error: `Pushover ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown Pushover error",
    };
  }
}
