const DEFAULT_GOOGLE_REVIEW_URL = "https://g.page/r/Cd8EVs2OPqvBEAI/review";

function firstName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? "there";
}

export function getGoogleReviewUrl() {
  return (
    process.env.GOOGLE_REVIEW_URL?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL?.trim() ||
    DEFAULT_GOOGLE_REVIEW_URL
  );
}

export function buildGoogleReviewRequestMessage(input: {
  clientName: string;
  reviewUrl: string;
}) {
  return [
    `Hi ${firstName(input.clientName)}, this is Double Le HVAC.`,
    "If you were happy with the work, would you mind leaving us a quick Google review? It helps our local business a lot.",
    input.reviewUrl,
    "Thank you!",
  ].join("\n");
}

export function buildGoogleReviewEmailHref(input: {
  email: string | null | undefined;
  message: string;
}) {
  const email = input.email?.trim();

  if (!email) {
    return null;
  }

  const params = new URLSearchParams({
    subject: "Quick favor from Double Le HVAC",
    body: input.message,
  });

  return `mailto:${encodeURIComponent(email)}?${params.toString()}`;
}
