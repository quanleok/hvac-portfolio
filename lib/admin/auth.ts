import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LOGIN_PATH = "/admin/login";

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/admin")) {
    return "/admin";
  }

  return value;
}

export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return {
    supabase,
    claims: data.claims,
  };
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect(LOGIN_PATH);
  }

  return session;
}
