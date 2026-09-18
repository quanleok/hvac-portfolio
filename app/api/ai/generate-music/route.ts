import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';
import { generateMusic } from '@/lib/evolink/video-music';
import {
  createAIGeneration,
  updateAIGeneration,
} from '@/lib/evolink/database';

/**
 * POST /api/ai/generate-music
 * Generate music using Evolink API (Suno V5)
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt, model, duration, style, mood } = await request.json();
  let generationId: string | null = null;

  if (!prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  const taskId = `mus-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const generation = await createAIGeneration({
      type: 'music',
      model: model || 'suno-v5',
      prompt,
      parameters: { duration, style, mood },
      result_url: '',
      status: 'processing',
      task_id: taskId,
      duration_seconds: duration,
    });
    generationId = generation.id ?? null;

    if (!generationId) {
      throw new Error('Failed to create music generation record');
    }

    const result = await generateMusic({
      model: model || 'suno-v5',
      prompt,
      duration: duration || 30,
      style,
      mood,
    });

    await updateAIGeneration(generationId, {
      result_url: result.url,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      musicUrl: result.url,
      taskId: result.taskId,
      generationId,
    });

  } catch (error) {
    console.error('Music generation failed:', error);

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
        error: error instanceof Error ? error.message : 'Music generation failed',
      },
      { status: 500 }
    );
  }
}
