import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';
import {
  getAIGenerationsByType,
  getRecentAIGenerations,
} from '@/lib/evolink/database';

/**
 * GET /api/ai/history
 * Get AI generation history
 */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', generations: [] }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'image' | 'video' | 'music' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let generations;

    if (type && (type === 'image' || type === 'video' || type === 'music')) {
      generations = await getAIGenerationsByType(type, limit, offset);
    } else {
      generations = await getRecentAIGenerations(limit);
    }

    return NextResponse.json({
      success: true,
      generations,
      count: generations.length,
    });

  } catch (error) {
    console.error('Failed to get history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get history',
        generations: [],
      },
      { status: 500 }
    );
  }
}
