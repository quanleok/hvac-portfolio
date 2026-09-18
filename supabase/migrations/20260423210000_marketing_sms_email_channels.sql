-- Replace Instagram/X marketing channels with SMS/Email.
-- Keeps existing data usable if the previous multi-platform migration already ran.

update public.marketing_posts
set platform = case platform
  when 'instagram' then 'sms'
  when 'x' then 'email'
  else platform
end
where platform in ('instagram', 'x');

update public.marketing_accounts
set platform = case platform
  when 'instagram' then 'sms'
  when 'x' then 'email'
  else platform
end
where platform in ('instagram', 'x');

update public.marketing_campaigns
set selected_platforms = coalesce(
  (
    select array_agg(distinct normalized.channel)
    from (
      select case channel
        when 'instagram' then 'sms'
        when 'x' then 'email'
        else channel
      end as channel
      from unnest(selected_platforms) as channels(channel)
      where channel in ('facebook', 'instagram', 'x', 'tiktok', 'youtube', 'sms', 'email')
    ) normalized
  ),
  '{}'::text[]
)
where selected_platforms && array['instagram', 'x'];

alter table public.marketing_posts
  drop constraint if exists marketing_posts_platform_check;

alter table public.marketing_posts
  add constraint marketing_posts_platform_check
  check (platform in ('facebook', 'sms', 'email', 'tiktok', 'youtube'));

alter table public.marketing_accounts
  drop constraint if exists marketing_accounts_platform_check;

alter table public.marketing_accounts
  add constraint marketing_accounts_platform_check
  check (platform in ('facebook', 'sms', 'email', 'tiktok', 'youtube'));
