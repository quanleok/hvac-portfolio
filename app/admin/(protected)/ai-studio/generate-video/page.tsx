'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  VIDEO_GENERATION_MODELS,
  VIDEO_PROMPT_TEMPLATES,
  optimizeVideoPrompt,
} from '@/lib/evolink/video-music';

const DURATION_OPTIONS = [5, 10, 15, 20, 30];
const VIDEO_ASPECT_RATIOS = ['16:9', '9:16', '1:1'] as const;

export default function VideoGenerationPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState<string>(VIDEO_PROMPT_TEMPLATES.promotional.summer);
  const [model, setModel] = useState<string>('seedance-2.0-fast-text-to-video');
  const [duration, setDuration] = useState(10);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedModel = VIDEO_GENERATION_MODELS.find((m) => m.id === model);
  const maxDuration = selectedModel?.maxDuration || 30;
  const durationOptions = DURATION_OPTIONS.filter((option) => option <= maxDuration);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setProgress(0);
    setError(null);
    setVideoUrl(null);
    const progressInterval = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 3000);

    try {
      const optimizedPrompt = optimizeVideoPrompt(prompt, {
        duration,
        season: prompt.toLowerCase().includes('summer') ? 'summer' : undefined,
      });

      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: optimizedPrompt,
          model,
          duration,
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setVideoUrl(data.videoUrl);
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      window.clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Generate Video
            </h1>
            <p className="text-blue-200">
              Create promotional videos with AI
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <form onSubmit={handleGenerate}>
              {/* Prompt */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Video Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  name="video-prompt"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="Describe the video you want to generate…"
                  required
                />
              </div>

              {/* Templates */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(VIDEO_PROMPT_TEMPLATES.promotional).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPrompt(value)}
                      className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-white/80 transition-colors capitalize"
                    >
                      Promotional: {key}
                    </button>
                  ))}
                  {Object.entries(VIDEO_PROMPT_TEMPLATES.testimonial).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPrompt(value)}
                      className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-white/80 transition-colors capitalize"
                    >
                      Testimonial: {key}
                    </button>
                  ))}
                  {Object.entries(VIDEO_PROMPT_TEMPLATES.seasonal).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPrompt(value)}
                      className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-white/80 transition-colors capitalize"
                    >
                      Seasonal: {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    // Auto-adjust duration based on model
                    const selectedModel = VIDEO_GENERATION_MODELS.find((m) => m.id === e.target.value);
                    if (selectedModel && duration > selectedModel.maxDuration) {
                      setDuration(selectedModel.maxDuration);
                    }
                  }}
                  name="video-model"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  {VIDEO_GENERATION_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (max {m.maxDuration}s) {'recommended' in m && m.recommended ? '⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Duration ({duration} seconds)
                </label>
                <input
                  type="range"
                  min="5"
                  max={maxDuration}
                  value={duration}
                  name="video-duration"
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>5s</span>
                  <span>{maxDuration}s</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDuration(option)}
                      className={`rounded px-3 py-2 text-sm transition-colors ${
                        duration === option
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {option}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {VIDEO_ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded px-3 py-2 text-sm transition-colors ${
                        aspectRatio === ratio
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={generating || !prompt}
                className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                  generating
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {generating ? `Generating ${duration}s ${
                  progress < 10 ? '…' : `(${progress}%)`
                }` : `Generate ${duration}s Video`}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-500/30 rounded-lg p-4" role="status" aria-live="polite">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Preview
            </h2>

            {generating && (
              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <p className="text-white">Generating video…</p>
                  <p className="text-white/70">{progress}%</p>
                  <p className="text-white/50 text-sm mt-2">
                    This may take 2-5 minutes
                  </p>
                </div>
              </div>
            )}

            {videoUrl && !generating && (
              <div className="space-y-4">
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg border border-white/10"
                />

                <div className="flex gap-2">
                  <a
                    href={videoUrl}
                    download
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-center transition-colors"
                  >
                    Download Video
                  </a>
                  <button
                    type="button"
                    onClick={() => setVideoUrl(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-colors"
                  >
                    Generate New
                  </button>
                </div>
              </div>
            )}

            {!videoUrl && !generating && (
              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <p className="text-white/50">
                  Your generated video will appear here
                </p>
              </div>
            )}

            {/* Settings */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-white font-medium mb-3">
                Current Settings
              </h3>
              <div className="space-y-2 text-sm text-white/70">
                <div>Model: <span className="text-white">{model}</span></div>
                <div>Duration: <span className="text-white">{duration} seconds</span></div>
                <div>Aspect ratio: <span className="text-white">{aspectRatio}</span></div>
                <div>Prompt length: <span className="text-white">{prompt.length} chars</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
