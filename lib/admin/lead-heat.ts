export const HOT_LEAD_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

export function isHotLead(input: { status: string; created_at: string }, now = Date.now()): boolean {
  if (input.status !== "lead") return false;
  const createdMs = new Date(input.created_at).getTime();
  if (Number.isNaN(createdMs)) return false;
  return now - createdMs <= HOT_LEAD_WINDOW_MS;
}

export function formatLeadAge(createdAt: string, now = Date.now()): string {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return "";
  const diffMs = Math.max(0, now - createdMs);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
