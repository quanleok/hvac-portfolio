"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  configured: boolean;
}

const STARTERS = [
  "Write a short Facebook post for spring AC tune-ups.",
  "Make this sound cleaner and less salesy.",
  "Plan 3 posts for this week: tune-up, install, review request.",
];

function messagePreview(message: ChatMessage) {
  return {
    role: message.role,
    content: message.content,
  };
}

export function OpenClawChat({ configured }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: configured
        ? "Tell me what you want to post. I can draft it, clean it up, or help schedule it."
        : "OpenClaw cloud is not connected yet. Add the gateway env vars, then this chat will be ready.",
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend = configured && input.trim().length > 0 && !pending;
  const visibleMessages = useMemo(() => messages.slice(-8), [messages]);

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || !configured || pending) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/admin/openclaw-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(messagePreview),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.message) {
        throw new Error(payload.error || "OpenClaw did not respond.");
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.message ?? "",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OpenClaw chat failed.");
    } finally {
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#203246] bg-[#0d1827]">
      <div className="flex flex-col gap-2 border-b border-[#203246] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#8fa8c0]">
            OpenClaw cloud
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">Chat with the marketing agent</h2>
        </div>
        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] ${
            configured
              ? "border-[#2f855a] bg-[#183324] text-[#9ae6b4]"
              : "border-[#8a6a2b] bg-[#393222] text-[#f6d58f]"
          }`}
        >
          {configured ? "Connected" : "Needs env"}
        </span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <div className="max-h-[22rem] space-y-3 overflow-y-auto rounded-xl border border-[#203246] bg-[#081220] p-3">
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto max-w-[86%] bg-[#d8e7f6] text-[#09121e]"
                    : "mr-auto max-w-[92%] border border-[#22344a] bg-[#101d2d] text-[#d7e2f0]"
                }`}
              >
                {message.content.split("\n").map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex < message.content.split("\n").length - 1 ? <br /> : null}
                  </span>
                ))}
              </div>
            ))}
            {pending ? (
              <p className="mr-auto max-w-[92%] rounded-xl border border-[#22344a] bg-[#101d2d] px-3 py-2 text-sm text-[#9aafc5]">
                OpenClaw is thinking...
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
              {error}
            </p>
          ) : null}

          <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!configured}
              rows={2}
              placeholder={
                configured
                  ? "Ask OpenClaw to draft, rewrite, post, or schedule..."
                  : "Set OPENCLAW_GATEWAY_URL and OPENCLAW_GATEWAY_TOKEN first."
              }
              className="min-h-12 flex-1 resize-none rounded-xl border border-[#24384d] bg-[#101d2d] px-4 py-3 text-sm text-white placeholder:text-[#6f8399] focus:border-[#4f7cff] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="min-h-12 rounded-xl bg-[#d8e7f6] px-5 text-sm font-extrabold text-[#09121e] hover:bg-white disabled:opacity-50"
            >
              {pending ? "Sending" : "Send"}
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8fa8c0]">
            Quick starts
          </p>
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              disabled={!configured || pending}
              onClick={() => void send(starter)}
              className="w-full rounded-xl border border-[#24384d] bg-[#101d2d] p-3 text-left text-sm font-semibold text-[#d7e2f0] hover:bg-[#142133] disabled:opacity-50"
            >
              {starter}
            </button>
          ))}
          <p className="pt-2 text-xs leading-5 text-[#8fa8c0]">
            The chat is server-proxied. OpenClaw keys stay out of the browser.
          </p>
        </div>
      </div>
    </section>
  );
}
