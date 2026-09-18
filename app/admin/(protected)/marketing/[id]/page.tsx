import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isPlatform, platformLabel } from "@/lib/marketing/schema";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { ShareLaunchpad } from "../components/share-launchpad";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scheduled?: string }>;
}

export default async function MarketingPostPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { scheduled } = await searchParams;

  const admin = createSupabaseAdminClient();
  const [{ data: post }, { data: jobs }, { data: assets }] = await Promise.all([
    admin
      .from("marketing_posts")
      .select(
        "id, campaign_id, campaign_name, platform, status, title, body, workflow, scheduled_at, posted_at, marketing_post_media(storage_path, mime_type)"
      )
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("marketing_agent_jobs")
      .select("id, job_type, status, error, completed_at, updated_at")
      .eq("post_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("marketing_assets")
      .select("id, source, kind, label, approval_status, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!post || !isPlatform(post.platform)) {
    notFound();
  }

  const media = Array.isArray(post.marketing_post_media) ? post.marketing_post_media[0] : null;

  const fileName = media?.storage_path.split("/").pop() ?? "media";

  const scheduledBanner =
    scheduled === "1" && post.scheduled_at
      ? `Scheduled for ${new Date(post.scheduled_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}. We'll email you when it's time.`
      : null;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <AdminBreadcrumbs
        items={[
          { label: "Marketing", href: "/admin/marketing" },
          { label: post.campaign_name ?? post.title ?? `${platformLabel(post.platform)} post` },
        ]}
      />

      {scheduledBanner && (
        <p className="rounded-md border border-[#25344a] bg-[#1a2c44] p-3 text-sm text-white">
          {scheduledBanner}
        </p>
      )}

      <div>
        <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#9aafc5]">
          {post.status}
        </p>
        <h1 className="text-2xl font-bold text-white">
          {platformLabel(post.platform)}
        </h1>
        {post.campaign_name ? (
          <p className="mt-1 text-sm text-[#9aafc5]">{post.campaign_name}</p>
        ) : null}
      </div>

      {((jobs?.length ?? 0) > 0 || (assets?.length ?? 0) > 0) && (
        <section className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
            Automation
          </h2>
          {jobs?.length ? (
            <div className="mt-3 space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-[#0a1626] px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-white">{job.job_type.replace(/_/g, " ")}</span>
                  <span className={job.status === "failed" ? "text-[#ff9ba7]" : "text-[#9aafc5]"}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {assets?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {assets.map((asset) => (
                <span
                  key={asset.id}
                  className="rounded-full border border-[#25344a] bg-[#142133] px-3 py-1 text-xs font-bold text-[#d7e2f0]"
                >
                  {asset.source} {asset.kind}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      )}

      <ShareLaunchpad
        postId={post.id}
        platform={post.platform}
        title={post.title}
        body={post.body}
        media={
          media
            ? {
                storagePath: media.storage_path,
                mimeType: media.mime_type,
                fileName,
              }
            : null
        }
      />
    </div>
  );
}
