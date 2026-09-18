import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeMetaCode, listMetaPages, META_SCOPES } from "@/lib/marketing/oauth";

export const dynamic = "force-dynamic";

function redirectWithStatus(request: NextRequest, status: string): NextResponse {
  const base = new URL("/admin/marketing/accounts", request.url);
  base.searchParams.set("meta", status);
  return NextResponse.redirect(base);
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const code = request.nextUrl.searchParams.get("code");
  const stateFromUrl = request.nextUrl.searchParams.get("state");
  const errorFromUrl = request.nextUrl.searchParams.get("error");
  const stateCookie = request.cookies.get("oauth_state_meta")?.value ?? null;

  if (errorFromUrl) {
    return redirectWithStatus(request, `denied`);
  }
  if (!code || !stateFromUrl) {
    return redirectWithStatus(request, `missing_code`);
  }
  if (!stateCookie || stateCookie !== stateFromUrl) {
    return redirectWithStatus(request, `bad_state`);
  }

  try {
    const tokenResponse = await exchangeMetaCode(code);
    const pages = await listMetaPages(tokenResponse.access_token);

    if (pages.length === 0) {
      return redirectWithStatus(request, `no_pages`);
    }

    const admin = createSupabaseAdminClient();
    for (const page of pages) {
      await admin
        .from("marketing_accounts")
        .upsert(
          {
            platform: "facebook",
            account_id: page.id,
            account_name: page.name,
            access_token: page.access_token,
            token_type: "Bearer",
            scopes: [...META_SCOPES],
            connected_by: userId,
            connected_at: new Date().toISOString(),
            last_refreshed_at: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: "platform,account_id" }
        );
    }

    const response = redirectWithStatus(request, "connected");
    response.cookies.delete("oauth_state_meta");
    return response;
  } catch (err) {
    console.error("[auth/meta/callback]", err);
    return redirectWithStatus(request, `failed`);
  }
}
