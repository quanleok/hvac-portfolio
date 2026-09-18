'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type GenerationType = 'image' | 'video' | 'music';
type GenerationFilter = GenerationType | 'all';

interface GenerationItem {
  id: string;
  type: GenerationType;
  model: string;
  prompt: string;
  result_url: string;
  duration_seconds: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  task_id: string;
  media_library_id: string | null;
  created_at: string;
}

interface HistoryResponse {
  generations?: GenerationItem[];
  error?: string;
}

interface SaveResponse {
  success?: boolean;
  media?: {
    id: string;
    url: string;
  };
  error?: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const FILTERS: { value: GenerationFilter; label: string; icon?: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images', icon: '📸' },
  { value: 'video', label: 'Videos', icon: '🎬' },
  { value: 'music', label: 'Music', icon: '🎵' },
];

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return DATE_FORMATTER.format(date);
}

export default function AIHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [filter, setFilter] = useState<GenerationFilter>('all');
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const loadGenerations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const response = await fetch(`/api/ai/history${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load');
      }

      const data = (await response.json()) as HistoryResponse;
      setGenerations(data.generations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load generations');
      setGenerations([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadGenerations();
  }, [loadGenerations]);

  const handleDownload = (url: string, filename: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  async function handleSaveToLibrary(item: GenerationItem) {
    setActionMessage(null);
    setSavingIds((current) => new Set(current).add(item.id));
    try {
      const response = await fetch('/api/ai/save-to-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          taskId: item.task_id,
          type: item.type,
          url: item.result_url,
          prompt: item.prompt,
        }),
      });
      const data = (await response.json()) as SaveResponse;

      if (!response.ok || !data.success || !data.media?.url) {
        throw new Error(data.error || 'Could not save to the website library.');
      }

      const savedMedia = data.media;
      setGenerations((current) =>
        current.map((generation) =>
          generation.id === item.id
            ? { ...generation, media_library_id: savedMedia.id, result_url: savedMedia.url }
            : generation
        )
      );
      setActionMessage({ kind: 'ok', text: 'Saved to the website library.' });
    } catch (err) {
      setActionMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Could not save to the website library.',
      });
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Generation History
              </h1>
              <p className="text-blue-200">
                View all your AI-generated content
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadGenerations}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {actionMessage ? (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm ${
              actionMessage.kind === 'ok'
                ? 'border-emerald-500/30 bg-emerald-900/20 text-emerald-200'
                : 'border-red-500/30 bg-red-900/20 text-red-200'
            }`}
            role="status"
            aria-live="polite"
          >
            {actionMessage.text}
          </div>
        ) : null}

        {/* Filters */}
        <div className="mb-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter AI generations">
            {FILTERS.map((item) => {
              const isActive = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setFilter(item.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon ? <span aria-hidden="true">{item.icon} </span> : null}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-12 text-center" role="status" aria-live="polite">
            <p className="text-white text-xl mb-4">
              Loading generations…
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-8 text-center" role="status" aria-live="polite">
            <p className="text-white text-xl mb-4">
              Failed to load generations
            </p>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              type="button"
              onClick={loadGenerations}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && generations.length === 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-12 text-center">
            <p className="text-white text-xl mb-4">
              No generations yet
            </p>
            <Link
              href="/admin/ai-studio/generate-image"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Start Generating →
            </Link>
          </div>
        )}

        {/* Generations Grid */}
        {!loading && !error && generations.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generations.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
              >
                {/* Preview */}
                <div className="aspect-video bg-white/5 overflow-hidden">
                  {item.type === 'image' && item.result_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.result_url}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  {item.type === 'image' && !item.result_url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl" aria-hidden="true">📸</span>
                    </div>
                  ) : null}
                  {item.type === 'video' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl" aria-hidden="true">🎬</span>
                    </div>
                  )}
                  {item.type === 'music' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl" aria-hidden="true">🎵</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  {/* Type Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase bg-white/10 px-2 py-1 rounded text-white/80">
                      {item.type}
                    </span>
                    <span className="text-xs text-white/50">
                      {item.duration_seconds ? `${item.duration_seconds}s` : ''}
                    </span>
                  </div>

                  {/* Model */}
                  <div className="text-xs text-white/60">
                    Model: <span className="text-white/80">{item.model}</span>
                  </div>

                  {/* Prompt */}
                  <p className="text-sm text-white/70 line-clamp-2">
                    {item.prompt}
                  </p>

                  {/* Metadata */}
                  <div className="pt-3 border-t border-white/10 space-y-1">
                    <div className="text-xs text-white/50 flex justify-between">
                      <span>Created:</span>
                      <span className="text-white/70">
                        {formatCreatedAt(item.created_at)}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 flex justify-between">
                      <span>Status:</span>
                      <span
                        className={`${
                          item.status === 'completed'
                            ? 'text-green-400'
                            : item.status === 'failed'
                              ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={!item.result_url}
                      onClick={() => handleDownload(item.result_url, `ai-${item.type}-${item.id}`)}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      Download
                    </button>
                    {(item.type === 'image' || item.type === 'video') && item.status === 'completed' && item.result_url ? (
                      item.media_library_id ? (
                        <Link
                          href="/admin/website/library"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm text-center transition-colors"
                        >
                          In Library
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveToLibrary(item)}
                          disabled={savingIds.has(item.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          {savingIds.has(item.id) ? 'Saving…' : 'Save'}
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
