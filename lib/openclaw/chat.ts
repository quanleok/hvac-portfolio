export interface OpenClawChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenClawChoice {
  message?: {
    content?: unknown;
  };
}

interface OpenClawChatResponse {
  choices?: OpenClawChoice[];
}

function getOpenClawConfig() {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL?.trim();
  const token =
    process.env.OPENCLAW_GATEWAY_TOKEN?.trim() ||
    process.env.OPENCLAW_GATEWAY_PASSWORD?.trim();

  if (!gatewayUrl || !token) return null;

  const model =
    process.env.OPENCLAW_AGENT_MODEL?.trim() ||
    (process.env.OPENCLAW_AGENT_ID?.trim()
      ? `openclaw/${process.env.OPENCLAW_AGENT_ID.trim()}`
      : "openclaw/default");
  const providerModel = process.env.OPENCLAW_PROVIDER_MODEL?.trim() || null;

  return {
    gatewayUrl,
    token,
    model,
    providerModel,
  };
}

export function isOpenClawChatConfigured() {
  return Boolean(getOpenClawConfig());
}

function chatCompletionUrl(gatewayUrl: string) {
  const trimmed = gatewayUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/v1/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function contentToText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export async function sendOpenClawChat(input: {
  messages: OpenClawChatMessage[];
}): Promise<{ ok: true; message: string } | { ok: false; error: string; status?: number }> {
  const config = getOpenClawConfig();
  if (!config) {
    return {
      ok: false,
      error: "OpenClaw cloud is not configured. Set OPENCLAW_GATEWAY_URL and OPENCLAW_GATEWAY_TOKEN.",
      status: 503,
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };
  if (config.providerModel) {
    headers["x-openclaw-model"] = config.providerModel;
  }

  const response = await fetch(chatCompletionUrl(config.gatewayUrl), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: input.messages,
    }),
  });

  let payload: OpenClawChatResponse | { error?: unknown } = {};
  try {
    payload = (await response.json()) as OpenClawChatResponse | { error?: unknown };
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error =
      payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `OpenClaw returned ${response.status}.`;
    return { ok: false, error, status: response.status };
  }

  const message = contentToText((payload as OpenClawChatResponse).choices?.[0]?.message?.content).trim();
  if (!message) {
    return { ok: false, error: "OpenClaw returned an empty response.", status: 502 };
  }

  return { ok: true, message };
}
