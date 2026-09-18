import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';
import { generateVideo } from '@/lib/evolink/video-music';
import {
  createAIGeneration,
  updateAIGeneration,
} from '@/lib/evolink/database';

/**
 * POST /api/ai/generate-video
 * Generate a video using Evolink API
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt, model, imageUrl, referenceUrl, duration, aspectRatio } = await request.json();
  let generationId: string | null = null;

  if (!prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  const taskId = `vid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const generation = await createAIGeneration({
      type: 'video',
      model: model || 'seedance-2.0-fast-text-to-video',
      prompt,
      parameters: { imageUrl, referenceUrl, duration, aspectRatio },
      result_url: '',
      status: 'processing',
      task_id: taskId,
      duration_seconds: duration,
    });
    generationId = generation.id ?? null;

    if (!generationId) {
      throw new Error('Failed to create video generation record');
    }

    const result = await generateVideo({
      model: model || 'seedance-2.0-fast-text-to-video',
      prompt,
      image_url: imageUrl,
      reference_url: referenceUrl,
      duration: duration || 10,
      aspect_ratio: aspectRatio || '16:9',
    });

    await updateAIGeneration(generationId, {
      result_url: result.url,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      videoUrl: result.url,
      taskId: result.taskId,
      generationId,
    });

  } catch (error) {
    console.error('Video generation failed:', error);

    if (generationId) {
      try {
        await updateAIGeneration(generationId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('Failed to update generation record:', dbError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Video generation failed',
      },
      { status: 500 }
    );
  }
}
