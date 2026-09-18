-- Provision the site-media storage bucket used for admin-uploaded photos and videos.
-- Writes go through the service role (SUPABASE_SERVICE_ROLE_KEY) via server actions
-- in app/admin/(protected)/media/actions.ts. Reads are public since the bucket is public.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  104857600, -- 100 MB
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
