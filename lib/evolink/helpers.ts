/**
 * Evolink API helper functions
 * Simplified wrappers for common use cases
 */

import { createEvolinkClient, EvolinkImageGenerationRequest } from './client';

/**
 * Supported aspect ratios with descriptions
 */
export const ASPECT_RATIOS = [
  { value: 'auto', label: 'Auto', description: 'Best fit for prompt' },
  { value: '16:9', label: '16:9', description: 'Hero banners, YouTube videos' },
  { value: '4:3', label: '4:3', description: 'Product shots, presentations' },
  { value: '1:1', label: '1:1', description: 'Social media, avatars' },
  { value: '9:16', label: '9:16', description: 'TikTok, Reels, Stories' },
  { value: '3:2', label: '3:2', description: 'Traditional photography' },
  { value: '2:3', label: '2:3', description: 'Posters, book covers' },
  { value: '3:4', label: '3:4', description: 'Instagram portraits' },
  { value: '4:5', label: '4:5', description: 'Instagram feed' },
  { value: '5:4', label: '5:4', description: 'Photo prints' },
  { value: '21:9', label: '21:9', description: 'Cinematic widescreen' },
  { value: '1:4', label: '1:4', description: 'Vertical banners' },
  { value: '4:1', label: '4:1', description: 'Horizontal banners' },
  { value: '1:8', label: '1:8', description: 'Ultra vertical' },
  { value: '8:1', label: '8:1', description: 'Ultra horizontal' },
] as const;

/**
 * Available image generation models
 */
export const IMAGE_MODELS = [
  { id: 'nano-banana-2-beta', name: 'Nano Banana 2 Beta', description: 'Fast, high-quality images', recommended: true },
  { id: 'nano-banana-pro-beta', name: 'Nano Banana Pro Beta', description: 'Pro-quality images' },
  { id: 'nano-banana-2-lite', name: 'Nano Banana 2 Lite', description: 'Lightweight generation' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image', description: 'Google Gemini pro images' },
  { id: 'gemini-3-flash-image', name: 'Gemini 3 Flash Image', description: 'Fast Gemini images' },
  { id: 'omnihuman-1.5', name: 'OmniHuman 1.5', description: 'Multimodal human generation' },
] as const;

/**
 * Available video generation models
 */
export const VIDEO_MODELS = [
  { id: 'seedance-2.0-fast-text-to-video', name: 'Seedance 2.0 Fast Text-to-Video', description: 'Fast video from text', recommended: true },
  { id: 'seedance-2.0-text-to-video', name: 'Seedance 2.0 Text-to-Video', description: 'Standard video from text' },
  { id: 'seedance-2.0-fast-image-to-video', name: 'Seedance 2.0 Fast Image-to-Video', description: 'Fast video from image' },
  { id: 'veo3.1-pro', name: 'Veo 3.1 Pro', description: 'Google professional video generation' },
  { id: 'veo3.1-pro-beta', name: 'Veo 3.1 Pro Beta', description: 'Beta version of pro video' },
] as const;

/**
 * Available music generation models
 */
export const MUSIC_MODELS = [
  { id: 'suno-v5', name: 'Suno V5', description: 'Latest Suno music generation', recommended: true },
  { id: 'suno-v5-beta', name: 'Suno V5 Beta', description: 'Beta version of Suno V5' },
] as const;

/**
 * Prompt templates for HVAC business
 */
export const HVAC_PROMPT_TEMPLATES = {
  technician: {
    hero: "Professional HVAC technician in uniform, friendly smile, adjusting modern air conditioning unit, clean residential interior, natural daylighting, high quality photo realistic",
    service: "HVAC technician servicing an AC unit, focused expression, professional tools, clean home environment, detailed work area",
    residential: "Technician explaining AC system to homeowner, friendly interaction, residential setting, trust and professionalism",
  },
  equipment: {
    acUnit: "Modern energy-efficient air conditioning unit, sleek design, pristine condition, residential installation, professional setup",
    furnace: "High-efficiency gas furnace, clean installation, residential basement or utility room, professional workmanship",
    thermostat: "Smart thermostat on wall, modern digital display, clean residential interior, energy efficiency",
  },
  services: {
    installation: "Team of technicians installing new HVAC system, residential home, professional equipment, clean and organized work area",
    repair: "Technician repairing AC unit, diagnostic tools, focused work, problem-solving, professional service",
    maintenance: "Annual HVAC maintenance service, technician checking filters and coils, thorough inspection, preventive care",
  },
  commercial: {
    storefront: "Double L Heat & Air commercial building, professional signage, clean exterior, Oklahoma City location",
    office: "Modern office space of HVAC company, professional atmosphere, customer service area, business operations",
  },
  testimonials: {
    satisfied: "Satisfied customer smiling with technician in residential setting, successful service completed, trust and satisfaction",
    handshake: "Professional handshake between technician and homeowner, successful service, business relationship, trust",
  },
  seasonal: {
    summer: "Air conditioning cooling a home on hot summer day, comfort and relief, residential interior, satisfied family",
    winter: "Heating system keeping home warm on cold winter day, cozy atmosphere, safe and efficient operation",
    storm: "HVAC technician working after a storm, emergency service, professional response, reliable service",
  }
} as const;

/**
 * Generate a single image with default settings
 */
export async function generateImage(
  prompt: string,
  options?: {
    model?: string;
    size?: string;
    quality?: 'standard' | 'hd';
  }
): Promise<{ url: string; taskId: string }> {
  const client = createEvolinkClient();

  if (!client) {
    throw new Error('Evolink API client not configured');
  }

  const taskId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const request: EvolinkImageGenerationRequest = {
    model: options?.model || 'nano-banana-2-beta',
    prompt,
    size: options?.size || '16:9',
    n: 1,
    quality: options?.quality || 'standard',
  };

  try {
    const url = await client.generateImage(request);
    return { taskId, url };
  } catch (error) {
    console.error('Image generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Image generation failed');
  }
}

/**
 * Generate image with multiple options (batch)
 */
export async function generateImagesBatch(
  prompt: string,
  count: number,
  options?: { model?: string; size?: string }
): Promise<{ url: string; index: number }[]> {
  const results = [];

  for (let i = 0; i < count; i++) {
    try {
      const result = await generateImage(
        prompt,
        options
      );
      results.push({ url: result.url, index: i });
    } catch (error) {
      console.error(`Failed to generate image ${i}:`, error);
      results.push({ url: '', index: i });
    }
  }

  return results;
}

/**
 * Optimize prompt for better image generation
 */
export function optimizePromptForHvac(prompt: string, context?: {
  service?: string;
  location?: string;
  season?: string;
}): string {
  const { service, location, season } = context || {};

  let optimized = prompt;

  // Add HVAC-specific quality keywords
  const qualityKeywords = [
    'high quality photo realistic',
    'professional grade',
    'clean and well-maintained',
    'residential or commercial setting',
    'professional HVAC work',
  ];

  if (!optimized.includes('photo realistic')) {
    optimized += ', ' + qualityKeywords.join(', ');
  }

  // Add service context
  if (service) {
    optimized += `, showing ${service} service or equipment`;
  }

  // Add location context
  if (location) {
    optimized += `, ${location} Oklahoma`;
  }

  // Add seasonal context
  if (season) {
    optimized += `, ${season} season`;
  }

  // Ensure Double L Heat & Air branding
  if (!optimized.includes('Double L Heat & Air') && !optimized.includes('HVAC')) {
    optimized = `Double L Heat & Air HVAC: ${optimized}`;
  }

  return optimized;
}

/**
 * Extract visual prompt from marketing text
 */
export function extractVisualPromptFromMarketing(marketingText: string): string {
  // Look for key phrases
  const text = marketingText.toLowerCase();

  let basePrompt = '';

  if (text.includes('installation') || text.includes('install')) {
    basePrompt = HVAC_PROMPT_TEMPLATES.services.installation;
  } else if (text.includes('repair') || text.includes('fix') || text.includes('broken')) {
    basePrompt = HVAC_PROMPT_TEMPLATES.services.repair;
  } else if (text.includes('maintenance') || text.includes('tune') || text.includes('check')) {
    basePrompt = HVAC_PROMPT_TEMPLATES.services.maintenance;
  } else if (text.includes('summer') || text.includes('cool') || text.includes('ac') || text.includes('air conditioning')) {
    basePrompt = HVAC_PROMPT_TEMPLATES.seasonal.summer;
  } else if (text.includes('winter') || text.includes('heat') || text.includes('furnace')) {
    basePrompt = HVAC_PROMPT_TEMPLATES.seasonal.winter;
  } else if (text.includes('customer') || text.includes('testimonial') || text.includes('satisfied')) {
    basePrompt = HVAC_PROMPT_TEMPLATES.testimonials.satisfied;
  } else {
    basePrompt = HVAC_PROMPT_TEMPLATES.technician.hero;
  }

  // Add any specific details from the marketing text
  const mentions = {
    'oklahoma city': 'Oklahoma City location',
    'oklahoma': 'Oklahoma setting',
    'residential': 'residential home',
    'commercial': 'commercial building',
    'emergency': 'emergency service',
    '24/7': '24/7 service availability',
    'professional': 'professional technician',
    'friendly': 'friendly service',
  };

  for (const [keyword, context] of Object.entries(mentions)) {
    if (text.includes(keyword) && !basePrompt.includes(context)) {
      basePrompt += `, ${context}`;
    }
  }

  // Look for discounts/specials
  const discountMatch = marketingText.match(/(\d+%|discount|special|promo|sale|offer)/i);
  if (discountMatch) {
    basePrompt += ', promotional offer or special discount';
  }

  return basePrompt;
}