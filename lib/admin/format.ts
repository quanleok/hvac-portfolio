export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== "number") return "Not set";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatFieldValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "Click to add";
  if (typeof value === "string" && !value.trim()) return "Click to add";
  return String(value);
}

export function formatPhoneHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}
