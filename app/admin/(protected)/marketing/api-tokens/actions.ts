"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateServiceToken } from "@/lib/auth/service-token";
import type { ActionResult } from "@/app/admin/actions";

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    throw new Error("Your admin session expired. Sign in again.");
  }
  return data.claims.sub;
}

export async function createServiceToken(input: {
  name: string;
}): Promise<ActionResult<{ plaintext: string; displayPrefix: string }>> {
  try {
    const createdBy = await requireSession();
    const name = input.name?.trim();
    if (!name) return { ok: false, error: "Name is required." };
    if (name.length > 80) return { ok: false, error: "Name must be 80 characters or fewer." };

    const token = generateServiceToken();
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("service_tokens").insert({
      name,
      token_hash: token.hash,
      token_prefix: token.displayPrefix,
      created_by: createdBy,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/marketing/api-tokens");
    return {
      ok: true,
      plaintext: token.plaintext,
      displayPrefix: token.displayPrefix,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create token.",
    };
  }
}

export async function revokeServiceToken(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing token id." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("service_tokens")
      .update({ is_active: false })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/marketing/api-tokens");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not revoke token.",
    };
  }
}
