'use client';

import { useId, useState } from 'react';
import { extractVisualPromptFromMarketing, IMAGE_MODELS, ASPECT_RATIOS } from '@/lib/evolink/helpers';
import type { MarketingPlatform } from '@/lib/marketing/schema';

export function AIVisualGenerator({
  marketingText,
  platform,
  onImageGenerated,
}: {
  marketingText: string;
  platform: MarketingPlatform;
  onImageGenerated: (url: string) => void;
}) {
  const titleId = useId();
  const promptId = useId();
  const modelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>('nano-banana-2-beta');
  const [size, setSize] = useState<string>(
    platform === 'youtube'
      ? '16:9'
      : platform === 'tiktok'
        ? '9:16'
        : '1:1'
  );
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAutoPrompt, setIsAutoPrompt] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);

    // Auto-extract prompt from marketing text
    if (marketingText) {
      const extractedPrompt = extractVisualPromptFromMarketing(marketingText);
      setPrompt(extractedPrompt);
      setIsAutoPrompt(true);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setIsAutoPrompt(false);

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, size }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setImageUrl(data.imageUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (imageUrl) {
      onImageGenerated(imageUrl);
      setIsOpen(false);
      setImageUrl(null);
      setPrompt('');
      setError(null);
    }
  };

  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="bg-[#07101c] border border-[#25344a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 id={titleId} className="text-xl font-semibold text-white">
                Generate Visual with AI
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI visual generator"
                className="text-[#9aafc5] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {isAutoPrompt && (
              <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-400 mb-1">
                  Auto-extracted from your post:
                </p>
                <p className="text-sm text-white">
                  Marketing: &ldquo;{marketingText.substring(0, 100)}&hellip;&rdquo;
                </p>
              </div>
            )}

            {imageUrl && (
              <div className="mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Generated image"
                  className="w-full rounded-lg border border-[#25344a]"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleUseImage}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Use This Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}

            {!imageUrl && (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label htmlFor={promptId} className="block text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5] mb-2">
                    Prompt
                  </label>
                  <textarea
                    id={promptId}
                    name="ai-visual-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
                    placeholder="Describe the visual…"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={modelId} className="block text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5] mb-2">
                    Model
                  </label>
                  <select
                    id={modelId}
                    name="ai-visual-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white focus:border-[#3a4e6e] focus:outline-none"
                  >
                    {IMAGE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {'recommended' in m && m.recommended ? '⭐' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5] mb-2">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ASPECT_RATIOS.slice(0, 4).map((ratio) => (
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

                {error && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3" role="status" aria-live="polite">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={generating || !prompt}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    generating
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {generating ? 'Generating…' : 'Generate Visual'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#25344a] bg-[#1a2c44] text-[#9aafc5] hover:bg-[#243654] hover:text-white transition-colors"
    >
      <span aria-hidden="true">🤖</span>
      <span className="text-sm font-semibold">Generate Visual</span>
    </button>
  );
}
