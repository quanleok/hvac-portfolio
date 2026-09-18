"use client";

import { useState, useTransition } from "react";
import { sendReviewRequestSmsAction } from "@/app/admin/actions";

interface ReviewRequestActionsProps {
  clientId: string;
  emailHref: string | null;
  reviewUrl: string;
}

export function ReviewRequestActions({
  clientId,
  emailHref,
  reviewUrl,
}: ReviewRequestActionsProps) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasEmail = Boolean(emailHref);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setFeedback("");
            startTransition(async () => {
              const result = await sendReviewRequestSmsAction({ clientId });

              if (!result.ok) {
                setFeedback(result.error);
                return;
              }

              setFeedback(`Review request sent to ${result.recipient}.`);
            });
          }}
          className={`admin-secondary-button w-full ${hasEmail ? "" : "col-span-2"}`.trim()}
        >
          {isPending ? "Sending…" : "Text review"}
        </button>
        {emailHref ? (
          <a href={emailHref} className="admin-secondary-button w-full">
            Email review
          </a>
        ) : null}
        <a
          href={reviewUrl}
          target="_blank"
          rel="noreferrer"
          className="admin-primary-button col-span-2 w-full"
        >
          Open Google link
        </a>
      </div>
      {feedback ? (
        <p className="text-sm text-[#9fd2ff]" aria-live="polite" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
