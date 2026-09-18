import { ReviewRequestActions } from "@/components/admin/review-request-actions";
import {
  buildGoogleReviewEmailHref,
  buildGoogleReviewRequestMessage,
  getGoogleReviewUrl,
} from "@/lib/admin/review-request";

interface ReviewRequestPanelProps {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
}

export function ReviewRequestPanel({
  clientId,
  clientName,
  clientEmail,
}: ReviewRequestPanelProps) {
  const reviewUrl = getGoogleReviewUrl();
  const message = buildGoogleReviewRequestMessage({ clientName, reviewUrl });
  const emailHref = buildGoogleReviewEmailHref({ email: clientEmail, message });

  return (
    <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
      <div className="mb-4 space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
          Google review
        </p>
        <p className="text-sm text-[#9aafc5]">
          Send the customer a quick review link after a good job.
        </p>
      </div>
      <ReviewRequestActions
        clientId={clientId}
        emailHref={emailHref}
        reviewUrl={reviewUrl}
      />
    </article>
  );
}
