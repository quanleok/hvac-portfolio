'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const IMAGE_MODELS = [
  { id: 'nano-banana-2-beta', name: 'Nano Banana 2 Beta', recommended: true },
  { id: 'nano-banana-pro-beta', name: 'Nano Banana Pro Beta' },
  { id: 'nano-banana-2-lite', name: 'Nano Banana 2 Lite' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image' },
  { id: 'gemini-3-flash-image', name: 'Gemini 3 Flash Image' },
  { id: 'omnihuman-1.5', name: 'OmniHuman 1.5' },
];

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9', desc: 'Hero, YouTube' },
  { value: '4:3', label: '4:3', desc: 'Product, presentation' },
  { value: '1:1', label: '1:1', desc: 'Social media, avatar' },
  { value: '9:16', label: '9:16', desc: 'TikTok, Reels' },
  { value: '3:2', label: '3:2', desc: 'Photography' },
  { value: '21:9', label: '21:9', desc: 'Cinematic' },
];

const PROMPT_TEMPLATES = {
  technician: "Professional HVAC technician in uniform, friendly smile, adjusting modern air conditioning unit, clean residential interior, natural daylighting, high quality photo realistic",
  installation: "Team of technicians installing new HVAC system, residential home, professional equipment, clean and organized work area",
  repair: "Technician repairing AC unit, diagnostic tools, focused work, problem-solving, professional service",
  maintenance: "Annual HVAC maintenance service, technician checking filters and coils, thorough inspection, preventive care",
  residential: "Technician explaining AC system to homeowner, friendly interaction, residential setting, trust and professionalism",
  commercial: "Double L Heat & Air commercial building, professional signage, clean exterior, Oklahoma City location",
  summer: "Air conditioning cooling a home on hot summer day, comfort and relief, residential interior, satisfied family",
  winter: "Heating system keeping home warm on cold winter day, cozy atmosphere, safe and efficient operation",
};

interface GenerationMeta {
  id: string;
  taskId: string;
}

interface GenerateImageResponse {
  imageUrl?: string;
  generationId?: string;
  taskId?: string;
  error?: string;
}

interface SaveToLibraryResponse {
  success?: boolean;
  media?: {
    url: string;
  };
  error?: string;
}

export default function ImageGenerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState<string>(() => {
    const template = searchParams.get('template');
    return template
      ? PROMPT_TEMPLATES[template as keyof typeof PROMPT_TEMPLATES] || ''
      : PROMPT_TEMPLATES.technician;
  });

  const [model, setModel] = useState<string>('nano-banana-2-beta');
  const [size, setSize] = useState<string>('16:9');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setProgress(0);
    setError(null);
    setSaveMessage(null);
    setImageUrl(null);
    setGenerationMeta(null);
    const progressInterval = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 1000);

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, size }),
      });

      const data = (await response.json()) as GenerateImageResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (!data.imageUrl || !data.generationId || !data.taskId) {
        throw new Error('Generation completed without a usable image.');
      }

      setImageUrl(data.imageUrl);
      setGenerationMeta({ id: data.generationId, taskId: data.taskId });
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      window.clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!imageUrl || !generationMeta) return;

    setSavingToLibrary(true);
    setSaveMessage(null);
    try {
      const response = await fetch('/api/ai/save-to-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: generationMeta.id,
          taskId: generationMeta.taskId,
          type: 'image',
          url: imageUrl,
          prompt,
        }),
      });
      const data = (await response.json()) as SaveToLibraryResponse;

      if (!response.ok || !data.success || !data.media?.url) {
        throw new Error(data.error || 'Could not save image to the library.');
      }

      setImageUrl(data.media.url);
      setSaveMessage({ kind: 'ok', text: 'Saved to the website library.' });
    } catch (err) {
      setSaveMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Could not save image to the library.',
      });
    } finally {
      setSavingToLibrary(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Generate Image
            </h1>
            <p className="text-blue-200">
              Create professional images with AI
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
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="Describe the image you want to generate…"
                  required
                />
              </div>

              {/* Templates */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PROMPT_TEMPLATES).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPrompt(value)}
                      className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-white/80 transition-colors capitalize"
                    >
                      {key}
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
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  {IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {'recommended' in m && m.recommended ? '⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => setSize(ratio.value)}
                      className={`px-3 py-2 rounded text-sm transition-colors ${
                        size === ratio.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {ratio.label}
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
                {generating ? 'Generating…' : 'Generate Image'}
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
                  <div className="text-2xl mb-2" aria-hidden="true">🎨</div>
                  <p className="text-white">Generating…</p>
                  <p className="text-white/70">{progress}%</p>
                </div>
              </div>
            )}

            {imageUrl && !generating && (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Generated image"
                  className="w-full rounded-lg border border-white/10"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={savingToLibrary || !generationMeta}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:cursor-wait disabled:opacity-60 text-white py-2 rounded-lg transition-colors"
                  >
                    {savingToLibrary ? 'Saving…' : 'Save to Library'}
                  </button>
                  <a
                    href={imageUrl}
                    download
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-center transition-colors"
                  >
                    Download
                  </a>
                </div>
                {saveMessage ? (
                  <p
                    className={saveMessage.kind === 'ok' ? 'text-sm text-emerald-300' : 'text-sm text-red-300'}
                    role="status"
                    aria-live="polite"
                  >
                    {saveMessage.text}
                  </p>
                ) : null}
              </div>
            )}

            {!imageUrl && !generating && (
              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <p className="text-white/50">
                  Your generated image will appear here
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
                <div>Size: <span className="text-white">{size}</span></div>
                <div>Prompt length: <span className="text-white">{prompt.length} chars</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
