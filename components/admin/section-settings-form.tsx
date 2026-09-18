"use client";

import { useState, useTransition } from "react";
import { updateSectionConfig } from "@/app/admin/(protected)/website/actions";
import type { MediaSectionRow } from "@/lib/supabase/database.types";
import { SCROLL_DIRECTIONS, SCROLL_SPEEDS } from "@/lib/media/schema";
import { LayoutPreview } from "@/components/admin/layout-preview";

const LAYOUT_OPTIONS: { id: "marquee" | "grid" | "carousel" | "fade"; label: string; hint: string }[] = [
  { id: "grid",     label: "Fixed grid",      hint: "All items visible at once, no motion." },
  { id: "marquee",  label: "Auto-scroll",     hint: "Continuous horizontal scroll, like a ticker." },
  { id: "carousel", label: "Swipeable",       hint: "Visitors swipe or scroll through manually." },
  { id: "fade",     label: "Slideshow fade",  hint: "One item at a time, cross-fades every 4s." },
];

export function SectionSettingsForm({ section }: { section: MediaSectionRow }) {
  const [form, setForm] = useState({
    enabled: section.enabled,
    title: section.title,
    layout: section.layout,
    scrollDirection: section.scroll_direction,
    scrollSpeed: section.scroll_speed,
    itemsVisible: section.items_visible,
    showCaptions: section.show_captions,
  });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    startTransition(async () => {
      const result = await updateSectionConfig({ id: section.id, ...form });
      setMessage(result.ok ? "Saved." : result.error);
    });
  }

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
        />
        Show this section on the public site
      </label>

      <label className="block text-sm text-white">
        <span className="block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">Title</span>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 block w-full rounded-md border border-[#25344a] bg-[#07101c] px-3 py-2 text-white"
        />
      </label>

      <fieldset>
        <legend className="block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">
          Layout
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {LAYOUT_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 text-sm text-white ${
                form.layout === opt.id
                  ? "border-[#3a4e6e] bg-[#1a2c44]"
                  : "border-[#25344a] bg-[#07101c]"
              }`}
            >
              <input
                type="radio"
                name="layout"
                value={opt.id}
                checked={form.layout === opt.id}
                onChange={() => setForm({ ...form, layout: opt.id })}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="block font-semibold">{opt.label}</span>
                <span className="text-xs text-[#6c8096]">{opt.hint}</span>
              </div>
              <LayoutPreview layout={opt.id} />
            </label>
          ))}
        </div>
      </fieldset>

      {form.layout === "marquee" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-white">
            <span className="block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">
              Scroll direction
            </span>
            <select
              value={form.scrollDirection}
              onChange={(e) => setForm({ ...form, scrollDirection: e.target.value as typeof form.scrollDirection })}
              className="mt-1 block w-full rounded-md border border-[#25344a] bg-[#07101c] px-3 py-2 text-white"
            >
              {SCROLL_DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-sm text-white">
            <span className="block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">
              Scroll speed
            </span>
            <select
              value={form.scrollSpeed}
              onChange={(e) => setForm({ ...form, scrollSpeed: e.target.value as typeof form.scrollSpeed })}
              className="mt-1 block w-full rounded-md border border-[#25344a] bg-[#07101c] px-3 py-2 text-white"
            >
              {SCROLL_SPEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {form.layout === "grid" || form.layout === "carousel" ? (
        <label className="block text-sm text-white sm:max-w-xs">
          <span className="block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">
            Items per row (2–6)
          </span>
          <input
            type="number"
            min={2}
            max={6}
            value={form.itemsVisible}
            onChange={(e) => setForm({ ...form, itemsVisible: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border border-[#25344a] bg-[#07101c] px-3 py-2 text-white"
          />
        </label>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={form.showCaptions}
          onChange={(e) => setForm({ ...form, showCaptions: e.target.checked })}
        />
        Show captions on hover
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save settings"}
        </button>
        {message ? <span className="text-sm text-[#9aafc5]">{message}</span> : null}
      </div>
    </div>
  );
}
