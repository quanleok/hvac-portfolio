import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  exchangeGoogleCode,
  getYouTubeChannel,
  GOOGLE_SCOPES,
} from "@/lib/marketing/oauth";

export const dynamic = "force-dynamic";

function redirectWithStatus(request: NextRequest, status: string): NextResponse {
  const base = new URL("/admin/marketing/accounts", request.url);
  base.searchParams.set("google", status);
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
  const stateCookie = request.cookies.get("oauth_state_google")?.value ?? null;

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
    const tokenResponse = await exchangeGoogleCode(code);
    const channel = await getYouTubeChannel(tokenResponse.access_token);

    if (!channel) {
      return redirectWithStatus(request, `no_channel`);
    }

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();

    const admin = createSupabaseAdminClient();
    await admin
      .from("marketing_accounts")
      .upsert(
        {
          platform: "youtube",
          account_id: channel.id,
          account_name: channel.title,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token ?? null,
          token_type: tokenResponse.token_type,
          expires_at: expiresAt,
          scopes: [...GOOGLE_SCOPES],
          connected_by: userId,
          connected_at: new Date().toISOString(),
          last_refreshed_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: "platform,account_id" }
      );

    const response = redirectWithStatus(request, "connected");
    response.cookies.delete("oauth_state_google");
    return response;
  } catch (err) {
    console.error("[auth/google/callback]", err);
    return redirectWithStatus(request, `failed`);
  }
}
