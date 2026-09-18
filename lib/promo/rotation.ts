// Deterministic rotation of marketing-only discount codes.
// Every 14 days the active code flips to the next one in the list.
// This is purely marketing — no dollar amount is enforced anywhere.
// The contact API echoes back a "discount applied" flag so the customer
// gets a confirmation, and the owner sees the code in the lead email/SMS.

const CODES = [
  "SAVE500",
  "COMFORT500",
  "OKCFIX500",
  "COOL4999",
  "WARM4999",
  "FRESH500",
  "HVAC500",
] as const;

export const ROTATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function getActivePromo(now: number = Date.now()): {
  code: string;
  expiresAt: number;
  spotsLeft: number;
} {
  const epoch = Math.floor(now / ROTATION_MS);
  const code = CODES[epoch % CODES.length];
  const expiresAt = (epoch + 1) * ROTATION_MS;

  // Fake-but-stable scarcity: start every rotation at 7, tick down with hours elapsed.
  const hoursIntoRotation = (now - epoch * ROTATION_MS) / (60 * 60 * 1000);
  const decay = Math.floor(hoursIntoRotation / ((14 * 24) / 7)); // 7 decrements across the window
  const spotsLeft = Math.max(2, 7 - decay);

  return { code, expiresAt, spotsLeft };
}

export function isValidPromoCode(input: string, now: number = Date.now()): boolean {
  const active = getActivePromo(now);
  return input.trim().toUpperCase() === active.code;
}
