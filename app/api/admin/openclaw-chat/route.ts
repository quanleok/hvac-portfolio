import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { sendOpenClawChat, type OpenClawChatMessage } from "@/lib/openclaw/chat";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4_000;

function parseMessages(value: unknown): OpenClawChatMessage[] | null {
  if (!Array.isArray(value)) return null;

  const messages: OpenClawChatMessage[] = [];
  for (const item of value.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    if (!("role" in item) || !("content" in item)) continue;
    const role = item.role;
    const content = item.content;
    if (role !== "user" && role !== "assistant" && role !== "system") continue;
    if (typeof content !== "string" || !content.trim()) continue;
    messages.push({
      role,
      content: content.trim().slice(0, MAX_CONTENT_LENGTH),
    });
  }

  return messages.length > 0 ? messages : null;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.");
  }

  const messages = parseMessages(body.messages);
  if (!messages) return err("Send at least one chat message.");

  const result = await sendOpenClawChat({
    messages: [
      {
        role: "system",
        content:
          "You are OpenClaw inside Double Le HVAC's admin Marketing Studio. Help the owner draft, improve, send, and schedule marketing posts. Keep replies short and action-focused. When the owner asks to post or schedule, use the connected Marketing API/tools available to your cloud agent if configured; otherwise explain the exact next action.",
      },
      ...messages.filter((message) => message.role !== "system"),
    ],
  });

  if (!result.ok) return err(result.error, result.status ?? 502);
  return ok({ message: result.message });
}
