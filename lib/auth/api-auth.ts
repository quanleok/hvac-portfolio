import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashServiceToken, parseBearerToken } from "./service-token";
import type { ServiceTokenRow } from "@/lib/supabase/database.types";

export interface AuthorizedContext {
  tokenId: string;
  tokenName: string;
}

/**
 * Validate a request's bearer token against the service_tokens table.
 * Updates last_used_at on success. Returns null on any failure (bad format,
 * unknown token, inactive token).
 *
 * Callers should check for null and return 401 to the client.
 */
export async function authorizeServiceRequest(
  request: NextRequest
): Promise<AuthorizedContext | null> {
  const header = request.headers.get("authorization");
  const plaintext = parseBearerToken(header);
  if (!plaintext) return null;

  const hash = hashServiceToken(plaintext);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("service_tokens")
    .select("id, name, is_active")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as Pick<ServiceTokenRow, "id" | "name" | "is_active">;
  if (!row.is_active) return null;

  // Fire-and-forget update of last_used_at; we don't block the request on this.
  admin
    .from("service_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(({ error: updateError }) => {
      if (updateError) {
        console.error("[api-auth] last_used_at update failed:", updateError.message);
      }
    });

  return { tokenId: row.id, tokenName: row.name };
}
