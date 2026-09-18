/**
 * Evolink API routes Next.js API handlers
 */

import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';
import { generateImage } from '@/lib/evolink/helpers';
import {
  createAIGeneration,
  updateAIGeneration,
} from '@/lib/evolink/database';

/**
 * POST /api/ai/generate-image
 * Generate an image using Evolink API
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt, model, size, quality } = await request.json();
  let generationId: string | null = null;

  if (!prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  // Create generation record
  const taskId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const generation = await createAIGeneration({
      type: 'image',
      model: model || 'nano-banana-2-beta',
      prompt,
      parameters: { size, quality },
      result_url: '', // Will be updated when complete
      status: 'processing',
      task_id: taskId,
    });
    generationId = generation.id ?? null;

    if (!generationId) {
      throw new Error('Failed to create image generation record');
    }

    const result = await generateImage(prompt, {
      model,
      size: size || '16:9',
      quality,
    });

    // Update generation record with results
    await updateAIGeneration(generationId, {
      result_url: result.url,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.url,
      taskId: result.taskId,
      generationId,
    });

  } catch (error) {
    console.error('Image generation failed:', error);

    // Update generation record with failure
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
        error: error instanceof Error ? error.message : 'Image generation failed',
      },
      { status: 500 }
    );
  }
}
