-- Remove the single-kind sections that allowed replacing hardcoded landing page media.
-- Companion strips are the only supported model going forward.

delete from public.media_assignments where section_id in (
  'hero-video',
  'about-building',
  'tech-action-video',
  'service-area-video',
  'technician-portrait'
);

delete from public.media_sections where id in (
  'hero-video',
  'about-building',
  'tech-action-video',
  'service-area-video',
  'technician-portrait'
);

-- Add 'fade' as an allowed layout (for Phase 2 cycle-fade feature).
alter table public.media_sections
  drop constraint if exists media_sections_layout_check;

alter table public.media_sections
  add constraint media_sections_layout_check
  check (layout in ('marquee', 'grid', 'carousel', 'fade'));
