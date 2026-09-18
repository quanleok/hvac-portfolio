import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMetaConfigured, isGoogleConfigured } from "@/lib/marketing/oauth";
import {
  PLATFORMS,
  platformLabel,
  platformSupportsNativeConnect,
  type MarketingPlatform,
} from "@/lib/marketing/schema";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AccountList } from "./account-list";

export const dynamic = "force-dynamic";

interface SearchParams {
  meta?: string;
  google?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

async function loadAccounts() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("marketing_accounts")
    .select("id, platform, account_id, account_name, connected_at, last_refreshed_at, scopes")
    .eq("is_active", true)
    .order("connected_at", { ascending: false });
  return data ?? [];
}

function statusMessage(
  kind: "meta" | "google",
  status: string | undefined
): {
  tone: "success" | "error";
  text: string;
} | null {
  if (!status) return null;
  const platform = kind === "meta" ? "Facebook" : "YouTube";
  switch (status) {
    case "connected":
      return { tone: "success", text: `${platform} account connected.` };
    case "denied":
      return { tone: "error", text: `${platform} authorization was cancelled.` };
    case "bad_state":
      return {
        tone: "error",
        text: `${platform} authorization blocked by a CSRF check — try again.`,
      };
    case "missing_code":
      return { tone: "error", text: `${platform} didn't return an authorization code.` };
    case "no_pages":
      return {
        tone: "error",
        text: `No Facebook Pages available for this account. Claim the Page in Meta Business Suite first.`,
      };
    case "no_channel":
      return { tone: "error", text: `No YouTube channel found for this Google account.` };
    case "failed":
      return { tone: "error", text: `${platform} connection failed. Check server logs.` };
    default:
      return null;
  }
}

function connectHref(platform: MarketingPlatform) {
  if (platform === "facebook") return "/api/auth/meta/initiate";
  if (platform === "youtube") return "/api/auth/google/initiate";
  return null;
}

function isManualChannel(platform: MarketingPlatform) {
  return platform === "sms" || platform === "email";
}

export default async function AccountsPage({ searchParams }: Props) {
  const params = await searchParams;
  const accounts = await loadAccounts();
  const metaConfigured = isMetaConfigured();
  const googleConfigured = isGoogleConfigured();

  const metaStatus = statusMessage("meta", params.meta);
  const googleStatus = statusMessage("google", params.google);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Marketing", href: "/admin/marketing" },
          { label: "Connected accounts" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">Connected accounts</h1>
        <p className="text-sm text-[#9aafc5]">
          Marketing Studio can create posts for Facebook, SMS, Email, TikTok, and YouTube. Facebook and
          YouTube can connect directly; SMS and Email are manual channels that do not need account setup.
        </p>
      </div>

      {metaStatus && (
        <p
          className={`rounded-md border p-3 text-sm ${
            metaStatus.tone === "success"
              ? "border-[#2a7a3a] bg-[#1a3a22] text-white"
              : "border-[#c53030] bg-[#5a1a1a] text-white"
          }`}
        >
          {metaStatus.text}
        </p>
      )}
      {googleStatus && (
        <p
          className={`rounded-md border p-3 text-sm ${
            googleStatus.tone === "success"
              ? "border-[#2a7a3a] bg-[#1a3a22] text-white"
              : "border-[#c53030] bg-[#5a1a1a] text-white"
          }`}
        >
          {googleStatus.text}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const platformAccounts = accounts.filter((account) => account.platform === platform);
          const nativeConfigured =
            platform === "facebook" ? metaConfigured : platform === "youtube" ? googleConfigured : false;
          const nativeConnect = platformSupportsNativeConnect(platform);
          const href = connectHref(platform);

          return (
            <section
              key={platform}
              className="space-y-4 rounded-[1.5rem] border border-[#25344a] bg-[#0f1c2d] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{platformLabel(platform)}</h2>
                  <p className="mt-1 text-sm text-[#9aafc5]">
                    {platformAccounts.length > 0
                      ? `${platformAccounts.length} account${platformAccounts.length === 1 ? "" : "s"} connected`
                      : isManualChannel(platform)
                        ? "Manual channel, ready now"
                      : nativeConnect
                        ? "Ready to connect directly"
                        : "Ready for planning"}
                  </p>
                </div>
                <span className="rounded-full border border-[#25344a] bg-[#142133] px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[#d7e2f0]">
                  {platformAccounts.length > 0
                    ? "Connected"
                    : isManualChannel(platform)
                      ? "Manual"
                      : nativeConnect
                        ? "Available"
                        : "Planned"}
                </span>
              </div>

              {platformAccounts.length > 0 ? (
                <AccountList
                  accounts={platformAccounts.map((account) => ({
                    id: account.id,
                    name: account.account_name,
                    accountId: account.account_id,
                    connectedAt: account.connected_at,
                  }))}
                />
              ) : null}

              {nativeConnect ? (
                nativeConfigured ? (
                  <a
                    href={href ?? "#"}
                    className="flex min-h-12 items-center justify-center rounded-[1rem] bg-[#d8e7f6] px-4 py-3 text-sm font-extrabold text-[#09121e] hover:bg-white"
                  >
                    {platformAccounts.length > 0
                      ? `Reconnect ${platformLabel(platform)}`
                      : `Connect ${platformLabel(platform)}`}
                  </a>
                ) : (
                  <p className="rounded-[1rem] border border-[#25344a] bg-[#101d2d] p-3 text-sm text-[#9aafc5]">
                    {platform === "facebook" ? (
                      <>
                        Set <code>META_APP_ID</code> and <code>META_APP_SECRET</code> in Vercel.
                      </>
                    ) : (
                      <>
                        Set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in Vercel.
                      </>
                    )}
                  </p>
                )
              ) : (
                <p className="rounded-[1rem] border border-[#25344a] bg-[#101d2d] p-3 text-sm text-[#9aafc5]">
                  {isManualChannel(platform)
                    ? `${platformLabel(platform)} uses the launchpad workflow now: copy the message, open the channel, send, then mark it posted.`
                    : `Post planning works now. Direct posting for ${platformLabel(platform)} can be added later.`}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
