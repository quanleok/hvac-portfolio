import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';
import { getMediaPublicUrl } from '@/lib/media/url';
import { MEDIA_BUCKET, buildStoragePath } from '@/lib/media/storage';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface SaveToLibraryRequest {
  id?: string;
  type?: string;
  url?: string;
  taskId?: string;
  filename?: string;
  prompt?: string;
}

function extensionFromContentType(contentType: string, type: 'image' | 'video') {
  if (contentType.includes('image/jpeg')) return 'jpg';
  if (contentType.includes('image/webp')) return 'webp';
  if (contentType.includes('image/png')) return 'png';
  if (contentType.includes('video/quicktime')) return 'mov';
  if (contentType.includes('video/mp4')) return 'mp4';
  return type === 'image' ? 'png' : 'mp4';
}

function fallbackContentType(type: 'image' | 'video') {
  return type === 'image' ? 'image/png' : 'video/mp4';
}

function normalizeMediaType(type: string | undefined): 'image' | 'video' | null {
  if (type === 'image' || type === 'video') return type;
  return null;
}

function fallbackFilename(type: 'image' | 'video', taskId: string | undefined, extension: string) {
  const stablePart = taskId?.replace(/[^a-zA-Z0-9._-]+/g, '-') || Date.now().toString();
  return `ai-${type}-${stablePart}.${extension}`;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as SaveToLibraryRequest;
    const mediaType = normalizeMediaType(payload.type);

    if (!payload.id || !payload.url || !mediaType) {
      return NextResponse.json(
        { error: 'Provide an AI generation id, image/video type, and result URL.' },
        { status: 400 }
      );
    }

    const source = await fetch(payload.url);
    if (!source.ok) {
      throw new Error(`Could not download generated media (${source.status}).`);
    }

    const contentType = source.headers.get('content-type') || fallbackContentType(mediaType);
    const uploadContentType =
      contentType === 'application/octet-stream' ? fallbackContentType(mediaType) : contentType;

    if (!uploadContentType.startsWith(`${mediaType}/`)) {
      return NextResponse.json(
        { error: `Generated file is not a ${mediaType}.` },
        { status: 400 }
      );
    }

    const blob = await source.blob();
    const extension = extensionFromContentType(uploadContentType, mediaType);
    const filename = payload.filename || fallbackFilename(mediaType, payload.taskId, extension);
    const storagePath = `ai-generated/${buildStoragePath(filename)}`;
    const admin = createSupabaseAdminClient();
    const buffer = new Uint8Array(await blob.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, buffer, {
        contentType: uploadContentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: mediaEntry, error: dbError } = await admin
      .from('media')
      .insert({
        storage_path: storagePath,
        type: mediaType,
        caption: payload.prompt ? 'AI generated media' : null,
        alt: payload.prompt?.slice(0, 180) ?? null,
      })
      .select('id, type, storage_path')
      .single();

    if (dbError || !mediaEntry) {
      await admin.storage.from(MEDIA_BUCKET).remove([storagePath]);
      throw new Error(dbError?.message ?? 'Could not create media library record.');
    }

    const publicUrl = getMediaPublicUrl(storagePath);

    const { error: generationUpdateError } = await admin
      .from('ai_generations')
      .update({
        media_library_id: mediaEntry.id,
        result_url: publicUrl,
      })
      .eq('id', payload.id);

    if (generationUpdateError) {
      console.error('AI generation link update failed:', generationUpdateError.message);
    }

    revalidatePath('/admin/website');
    revalidatePath('/admin/website/library');
    revalidatePath('/gallery');

    return NextResponse.json({
      success: true,
      media: {
        id: mediaEntry.id,
        type: mediaEntry.type,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error('Save to library failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save to library',
      },
      { status: 500 }
    );
  }
}
