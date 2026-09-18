import crypto from "node:crypto";

export const TOKEN_PREFIX = "dlhvac_";
const DISPLAY_PREFIX_LENGTH = 16; // "dlhvac_" (7) + 9 hex chars

export interface GeneratedToken {
  // Plaintext — shown ONCE to the user on creation, never stored.
  plaintext: string;
  // SHA-256 hash — stored in the DB for lookup.
  hash: string;
  // Display prefix — e.g., "dlhvac_a1b2c3d4" — safe to store and show in the UI.
  displayPrefix: string;
}

export function generateServiceToken(): GeneratedToken {
  const random = crypto.randomBytes(32).toString("hex");
  const plaintext = `${TOKEN_PREFIX}${random}`;
  const hash = hashServiceToken(plaintext);
  const displayPrefix = plaintext.slice(0, DISPLAY_PREFIX_LENGTH);
  return { plaintext, hash, displayPrefix };
}

export function hashServiceToken(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  return token;
}
