/**
 * Evolink API Client
 * Provides typed interfaces for the Evolink AI platform (image, video, music generation)
 * Docs: https://docs.evolink.ai/en/api-manual
 */

export interface EvolinkConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface EvolinkImageGenerationRequest {
  model: string;
  prompt: string;
  size?: string; // Aspect ratios: auto, 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9, 1:4, 4:1, 1:8, 8:1
  n?: number; // Number of images (default 1)
  quality?: 'standard' | 'hd';
}

export interface EvolinkVideoGenerationRequest {
  model: string;
  prompt: string;
  image_url?: string; // For image-to-video
  reference_url?: string; // For reference-to-video
  duration?: number; // In seconds
  aspect_ratio?: string;
}

export interface EvolinkMusicGenerationRequest {
  model: string;
  prompt: string;
  duration?: number; // In seconds
  style?: string;
}

export interface EvolinkTask {
  id: string;
  model: string;
  type: 'image' | 'video' | 'music';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created: number;
  duration?: number;
  results?: string[];
  result_data?: Array<{ url: string }>;
}

export interface EvolinkErrorResponse {
  error: {
    code: string;
    message: string;
    type: string;
  };
}

export class EvolinkClient {
  private config: EvolinkConfig;

  constructor(config: EvolinkConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.evolink.ai/v1',
      apiKey: config.apiKey,
    };
  }

  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List available models
   */
  async getModels(): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl}/models`, {
      headers: this.headers,
    });

    if (!response.ok) {
      const error: EvolinkErrorResponse = await response.json();
      throw new Error(`List models failed: ${error.error.message}`);
    }

    const data = (await response.json()) as { data: Array<{ id: string }> };
    return data.data.map((m) => m.id);
  }

  /**
   * Generate images
   */
  async generateImage(request: EvolinkImageGenerationRequest): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: EvolinkErrorResponse = await response.json();
      throw new Error(`Image generation failed: ${error.error.message}`);
    }

    const task: EvolinkTask = await response.json();

    // Wait for completion
    return await this.waitForTask(task.id, 'image');
  }

  /**
   * Generate video
   */
  async generateVideo(request: EvolinkVideoGenerationRequest): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/videos/generations`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: EvolinkErrorResponse = await response.json();
      throw new Error(`Video generation failed: ${error.error.message}`);
    }

    const task: EvolinkTask = await response.json();

    // Wait for completion
    return await this.waitForTask(task.id, 'video');
  }

  /**
   * Generate music
   */
  async generateMusic(request: EvolinkMusicGenerationRequest): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/audio/generations`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: EvolinkErrorResponse = await response.json();
      throw new Error(`Music generation failed: ${error.error.message}`);
    }

    const task: EvolinkTask = await response.json();

    // Wait for completion
    return await this.waitForTask(task.id, 'music');
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<EvolinkTask> {
    const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      const error: EvolinkErrorResponse = await response.json();
      throw new Error(`Get task status failed: ${error.error.message}`);
    }

    return await response.json();
  }

  /**
   * Wait for task completion
   */
  async waitForTask(taskId: string, type: 'image' | 'video' | 'music', maxWaitSeconds = 600): Promise<string> {
    const startTime = Date.now();
    const checkInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      const task = await this.getTaskStatus(taskId);

      if (task.status === 'completed') {
        if (task.results && task.results.length > 0) {
          return task.results[0];
        }
        if (task.result_data && task.result_data.length > 0) {
          return task.result_data[0].url;
        }
        throw new Error(`Task completed but no result URL found`);
      }

      if (task.status === 'failed') {
        throw new Error(`Task failed: ${taskId}`);
      }

      if (task.progress === 100) {
        // Task might be done but results not yet populated
        return await this.getFinalResult(taskId, type);
      }

      // Wait and check again
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Task timeout after ${maxWaitSeconds} seconds`);
  }

  /**
   * Get final result from completed task
   */
  private async getFinalResult(taskId: string, type: string): Promise<string> {
    const task = await this.getTaskStatus(taskId);

    if (task.results && task.results.length > 0) {
      return task.results[0];
    }

    if (task.result_data && task.result_data.length > 0) {
      return task.result_data[0].url;
    }

    throw new Error(`No result found for ${type} task: ${taskId}`);
  }
}

/**
 * Create Evolink client from environment
 */
export function createEvolinkClient(): EvolinkClient | null {
  const apiKey = process.env.EVOLINK_API_KEY;

  if (!apiKey) {
    console.warn('EVOLINK_API_KEY not configured');
    return null;
  }

  return new EvolinkClient({
    apiKey,
    baseUrl: process.env.EVOLINK_BASE_URL || 'https://api.evolink.ai/v1',
  });
}
