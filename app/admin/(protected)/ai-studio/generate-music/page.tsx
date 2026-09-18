'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MUSIC_GENERATION_MODELS, MUSIC_STYLES } from '@/lib/evolink/video-music';

const DURATION_OPTIONS = [15, 30, 60, 90, 120];

export default function MusicGenerationPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState<string>('Professional corporate background music, upbeat and confident, suitable for HVAC promotional video');
  const [model, setModel] = useState<string>('suno-v5');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState<string>('upbeat');
  const [mood, setMood] = useState<string>('confident');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setProgress(0);
    setError(null);
    setMusicUrl(null);
    const progressInterval = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 2000);

    try {
      const response = await fetch('/api/ai/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          duration,
          style,
          mood,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setMusicUrl(data.musicUrl);
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      window.clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-slate-900 p-8">
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
              Generate Music
            </h1>
            <p className="text-pink-200">
              Create background music and audio with AI
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
                  Music Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  name="music-prompt"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-pink-500"
                  placeholder="Describe the music you want to generate…"
                  required
                />
              </div>

              {/* Model */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  name="music-model"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                >
                  {MUSIC_GENERATION_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {'recommended' in m && m.recommended ? '⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  name="music-style"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                >
                  {MUSIC_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Mood / Atmosphere
                </label>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  name="music-mood"
                  placeholder="confident, energetic, calm, warm…"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Duration ({duration} seconds)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`px-3 py-2 rounded text-sm transition-colors ${
                        duration === d
                          ? 'bg-pink-600 text-white'
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {d}s
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
                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                }`}
              >
                {generating ? `Generating ${duration}s (${
                  progress < 10 ? '…' : `${progress}%`
                })` : `Generate ${duration}s Music`}
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
              <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎵</div>
                  <p className="text-white">Generating music…</p>
                  <p className="text-white/70">{progress}%</p>
                  <p className="text-white/50 text-sm mt-2">
                    This may take 1-3 minutes
                  </p>
                </div>
              </div>
            )}

            {musicUrl && !generating && (
              <div className="space-y-4">
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎵</div>
                    <audio
                      controls
                      src={musicUrl}
                      className="w-full max-w-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={musicUrl}
                    download
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-center transition-colors"
                  >
                    Download Music
                  </a>
                  <button
                    type="button"
                    onClick={() => setMusicUrl(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-colors"
                  >
                    Generate New
                  </button>
                </div>
              </div>
            )}

            {!musicUrl && !generating && (
              <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <p className="text-white/50">
                  Your generated music will appear here
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
                <div>Style: <span className="text-white">{style}</span></div>
                <div>Mood: <span className="text-white">{mood}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
