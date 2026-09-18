/**
 * Video generation utilities for Evolink API
 */

import { createEvolinkClient } from './client';

export interface VideoGenerationRequest {
  model: string;
  prompt: string;
  image_url?: string; // For image-to-video
  reference_url?: string; // For reference-to-video
  duration?: number; // In seconds (typically 5-30)
  aspect_ratio?: string;
}

export interface MusicGenerationRequest {
  model: string;
  prompt: string;
  duration?: number; // In seconds
  style?: string;
  mood?: string;
}

interface VideoGenerationModel {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  maxDuration: number;
}

interface MusicGenerationModel {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

// Video generation models
export const VIDEO_GENERATION_MODELS: readonly VideoGenerationModel[] = [
  { id: 'seedance-2.0-fast-text-to-video', name: 'Seedance 2.0 Fast Text-to-Video', description: 'Fast video from text prompt', recommended: true, maxDuration: 10 },
  { id: 'seedance-2.0-text-to-video', name: 'Seedance 2.0 Text-to-Video', description: 'Standard video from text', maxDuration: 15 },
  { id: 'seedance-2.0-fast-image-to-video', name: 'Seedance 2.0 Fast Image-to-Video', description: 'Fast video from image', maxDuration: 10 },
  { id: 'seedance-2.0-image-to-video', name: 'Seedance 2.0 Image-to-Video', description: 'Standard video from image', maxDuration: 15 },
  { id: 'veo3.1-pro', name: 'Veo 3.1 Pro', description: 'Google professional video', recommended: true, maxDuration: 30 },
  { id: 'veo3.1-pro-beta', name: 'Veo 3.1 Pro Beta', description: 'Beta version of pro video', maxDuration: 30 },
] ;

// Music generation models
export const MUSIC_GENERATION_MODELS: readonly MusicGenerationModel[] = [
  { id: 'suno-v5', name: 'Suno V5', description: 'Latest music generation', recommended: true },
  { id: 'suno-v5-beta', name: 'Suno V5 Beta', description: 'Beta version of Suno V5' },
];

// Video prompt templates for HVAC business
export const VIDEO_PROMPT_TEMPLATES = {
  promotional: {
    summer: "Professional HVAC technician explaining AC services, friendly demeanor, clean residential kitchen, confident delivery, daylight through windows",
    winter: "Technician showing heating system improvements, cozy warm interior, satisfied customer nodding, professional service",
    installation: "Team of technicians installing new AC unit, clean work site, professional coordination, residential home, teamwork",
    emergency: "Technician arriving at customer's home, urgent but calm demeanor, professional preparation, 24/7 service vibes",
  },
  testimonial: {
    satisfied: "Customer smiling and nodding while technician explains completed work, residential living room, trust and satisfaction, natural conversation",
    handshake: "Professional handshake between technician and homeowner, successful service, warm lighting, residential hallway",
    showcase: "Before-and-after transformation: technician points to new installation, customer impressed, modern equipment, clean room",
  },
  educational: {
    maintenance: "Time-lapse or step-by-step: technician performing annual AC maintenance, checking filters, cleaning coils, professional methodology",
    troubleshooting: "Technician diagnosing AC issue, using tools methodically, problem-solving focus, explaining to customer",
    energyEfficiency: "Technician showing customer energy-efficient settings on thermostat, explaining savings, residential utility area",
  },
  brand: {
    intro: "Double L Heat & Air logo animation, professional HVAC imagery, company colors, crisp transitions, 5-second bumper",
    team: "Montage of technicians at work, quick cuts, professional smiles, variety of services, company branding overlay",
    values: "Slow-motion shots: technician cleaning work area, detailed care, customer satisfaction, reliability visuals",
  },
  seasonal: {
    spring: "Flower blooming time-lapse, technician opening windows for spring service, fresh air vibe, residential",
    summer: "Heat waves, air conditioning close-ups, customer relaxing in cool room after installation, relief",
    fall: "Leaf transition, technician checking heating system for winter, preparatory maintenance, cozy",
    winter: "Snow outside window, warm interior glow, technician adjusting thermostat, heating service, comfort",
  },
} as const;

// Music style presets
export const MUSIC_STYLES = [
  { id: 'upbeat', name: 'Upbeat Corporate', description: 'Energetic, confident, business-focused' },
  { id: 'calm', name: 'Calm & Trustworthy', description: 'Reliable, peaceful, professional' },
  { id: 'professional', name: 'Professional Corporate', description: 'Confident, steady, business' },
  { id: 'warm', name: 'Warm & Friendly', description: 'Welcoming, approachable, local' },
  { id: 'dramatic', name: 'Dramatic Promotional', description: 'Bold, impactful, attention-grabbing' },
  { id: 'ambient', name: 'Ambient Background', description: 'Subtle, non-intrusive, supportive' },
] as const;

/**
 * Generate video from prompt
 */
export async function generateVideo(request: VideoGenerationRequest): Promise<{ url: string; taskId: string }> {
  const client = createEvolinkClient();

  if (!client) {
    throw new Error('Evolink API client not configured');
  }

  const taskId = `vid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const url = await client.generateVideo({
      ...request,
      prompt: request.prompt,
      model: request.model,
    });

    return { taskId, url };
  } catch (error) {
    console.error('Video generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Video generation failed');
  }
}

/**
 * Generate music from prompt
 */
export async function generateMusic(request: MusicGenerationRequest): Promise<{ url: string; taskId: string }> {
  const client = createEvolinkClient();

  if (!client) {
    throw new Error('Evolink API client not configured');
  }

  const taskId = `mus-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const url = await client.generateMusic({
      ...request,
      prompt: request.prompt,
      model: request.model,
    });

    return { taskId, url };
  } catch (error) {
    console.error('Music generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Music generation failed');
  }
}

/**
 * Optimize video prompt for HVAC business
 */
export function optimizeVideoPrompt(basePrompt: string, context?: {
  duration?: number;
  season?: string;
  service?: string;
}): string {
  const { season, service } = context || {};

  let optimized = basePrompt;

  // Add HVAC context
  if (!optimized.toLowerCase().includes('hvac') && !optimized.toLowerCase().includes('technician')) {
    optimized = `HVAC service: ${optimized}`;
  }

  // Add Double L branding
  if (!optimized.includes('Double L Heat & Air')) {
    // Keep it subtle - don't force logo unless specified
  }

  // Add seasonal context
  if (season) {
    optimized += `, ${season} setting`;
  }

  // Add service context
  if (service) {
    optimized += `, demonstrating ${service} service`;
  }

  // Add technical quality keywords
  const qualityKeywords = [
    'professional service',
    'clean work environment',
    'residential setting',
    'friendly customer interaction',
    'high quality video',
  ];

  const hasQuality = qualityKeywords.some(keyword => optimized.toLowerCase().includes(keyword));
  if (!hasQuality) {
    optimized += ', professional service, clean environment, customer satisfaction';
  }

  return optimized;
}

/**
 * Extract video prompt from marketing text
 */
export function extractVideoPromptFromMarketing(marketingText: string): { prompt: string; style: string } {
  const text = marketingText.toLowerCase();

  // Determine style based on tone
  let style = 'professional';

  if (text.includes('summer') || text.includes('special') || text.includes('deal')) {
    style = 'upbeat';
  } else if (text.includes('emergency') || text.includes('urgent')) {
    style = 'dramatic';
  } else if (text.includes('trust') || text.includes('reliable') || text.includes('family')) {
    style = 'warm';
  } else if (text.includes('maintenance') || text.includes('check')) {
    style = 'calm';
  }

  // Determine template
  let basePrompt = '';

  if (text.includes('testi') || text.includes('review') || text.includes('customer')) {
    basePrompt = VIDEO_PROMPT_TEMPLATES.testimonial.satisfied;
  } else if (text.includes('install') || text.includes('new system')) {
    basePrompt = VIDEO_PROMPT_TEMPLATES.promotional.installation;
  } else if (text.includes('summer') || text.includes('cool') || text.includes('ac')) {
    basePrompt = VIDEO_PROMPT_TEMPLATES.promotional.summer;
  } else if (text.includes('winter') || text.includes('heat') || text.includes('furnace')) {
    basePrompt = VIDEO_PROMPT_TEMPLATES.promotional.winter;
  } else if (text.includes('emergency') || text.includes('24/7') || text.includes('urgent')) {
    basePrompt = VIDEO_PROMPT_TEMPLATES.promotional.emergency;
  } else if (text.includes('maintenance') || text.includes('tune-up') || text.includes('check')) {
    basePrompt = VIDEO_PROMPT_TEMPLATES.educational.maintenance;
  } else {
    basePrompt = VIDEO_PROMPT_TEMPLATES.promotional.summer;
  }

  // Add specific mentions from marketing text
  const mentions = {
    'oklahoma city': 'Oklahoma City area',
    'residential': 'residential homes',
    'commercial': 'commercial properties',
    'educational': 'demonstrating and explaining',
    'professional': 'professional service delivery',
  };

  for (const [keyword, context] of Object.entries(mentions)) {
    if (text.includes(keyword)) {
      basePrompt += `, ${context}`;
    }
  }

  return { prompt: basePrompt, style };
}
