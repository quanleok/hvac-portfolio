/**
 * AI generation history database operations
 * Manage AI content generation records in Supabase
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  AIGenerationInsert,
  AIGenerationRow,
  AIGenerationUpdate,
} from '@/lib/supabase/database.types';

export type AIGenerationRecord = AIGenerationRow;

/**
 * Create a new AI generation record
 */
export async function createAIGeneration(
  record: Omit<AIGenerationInsert, 'id' | 'created_at' | 'created_by'>
): Promise<AIGenerationRecord> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('ai_generations')
    .insert({
      ...record,
      created_by: 'admin',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create AI generation record:', error);
    throw new Error(`Failed to create record: ${error.message}`);
  }

  return data;
}

/**
 * Update AI generation record (e.g., when generation completes)
 */
export async function updateAIGeneration(
  id: string,
  updates: AIGenerationUpdate
): Promise<AIGenerationRecord> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('ai_generations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update AI generation record:', error);
    throw new Error(`Failed to update record: ${error.message}`);
  }

  return data;
}

/**
 * Get AI generation by ID
 */
export async function getAIGeneration(id: string): Promise<AIGenerationRecord | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('ai_generations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Failed to get AI generation:', error);
    throw new Error(`Failed to get record: ${error.message}`);
  }

  return data;
}

/**
 * Get AI generations by type
 */
export async function getAIGenerationsByType(
  type: 'image' | 'video' | 'music',
  limit: number = 50,
  offset: number = 0
): Promise<AIGenerationRecord[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('ai_generations')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to get AI generations by type:', error);
    throw new Error(`Failed to get records: ${error.message}`);
  }

  return data || [];
}

/**
 * Get recent AI generations
 */
export async function getRecentAIGenerations(
  limit: number = 20
): Promise<AIGenerationRecord[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('ai_generations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get recent AI generations:', error);
    throw new Error(`Failed to get records: ${error.message}`);
  }

  return data || [];
}

/**
 * Search AI generations by prompt
 */
export async function searchAIGenerations(
  query: string,
  limit: number = 20
): Promise<AIGenerationRecord[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('ai_generations')
    .select('*')
    .ilike('prompt', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to search AI generations:', error);
    throw new Error(`Failed to search: ${error.message}`);
  }

  return data || [];
}

/**
 * Get AI generation stats (by type, model, etc.)
 */
export async function getAIGenerationStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byModel: Record<string, number>;
  recent: number;
}> {
  const supabase = createSupabaseAdminClient();

  // Get total count
  const { count: total } = await supabase
    .from('ai_generations')
    .select('*', { count: 'exact', head: true });

  // Get by type
  const { data: byTypeData } = await supabase
    .from('ai_generations')
    .select('type')
    .not('type', 'is', null);

  const byType: Record<string, number> = {};
  byTypeData?.forEach((item) => {
    byType[item.type] = (byType[item.type] || 0) + 1;
  });

  // Get by model
  const { data: byModelData } = await supabase
    .from('ai_generations')
    .select('model')
    .not('model', 'is', null);

  const byModel: Record<string, number> = {};
  byModelData?.forEach((item) => {
    byModel[item.model] = (byModel[item.model] || 0) + 1;
  });

  // Get recent (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recent } = await supabase
    .from('ai_generations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  return {
    total: total || 0,
    byType,
    byModel,
    recent: recent || 0,
  };
}

/**
 * Delete AI generation
 */
export async function deleteAIGeneration(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from('ai_generations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete AI generation:', error);
    throw new Error(`Failed to delete: ${error.message}`);
  }
}

/**
 * Link AI generation to media library
 */
export async function linkGenerationToMediaLibrary(
  generationId: string,
  mediaLibraryId: string
): Promise<void> {
  await updateAIGeneration(generationId, {
    media_library_id: mediaLibraryId,
  });
}

/**
 * Link AI generation to marketing post
 */
export async function linkGenerationToPost(
  generationId: string,
  postId: string
): Promise<void> {
  await updateAIGeneration(generationId, {
    used_in_post_id: postId,
  });
}
