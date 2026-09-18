"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/admin/actions";

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    throw new Error("Your admin session expired. Sign in again.");
  }
}

export async function disconnectAccount(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing account id." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("marketing_accounts")
      .update({ is_active: false })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/marketing");
    revalidatePath("/admin/marketing/accounts");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not disconnect.",
    };
  }
}
