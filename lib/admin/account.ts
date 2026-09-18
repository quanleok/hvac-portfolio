export const OWNER_LOGIN_DOMAIN = "doublelehvac.local";

export function normalizeOwnerLoginIdentifier(value: string): string {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("@")) {
    return trimmed;
  }

  return `${trimmed}@${OWNER_LOGIN_DOMAIN}`;
}
