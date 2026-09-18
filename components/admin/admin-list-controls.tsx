"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAdminSegmentClass, type Tone } from "@/lib/visual-system";

interface FilterOption {
  label: string;
  value: string;
  count: number;
  tone: Tone;
}

interface AdminListControlsProps {
  basePath: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchTerm: string;
  currentView: string;
  options: FilterOption[];
}

function buildAdminListHref(basePath: string, searchTerm: string, view: string) {
  const params = new URLSearchParams();
  const trimmedSearch = searchTerm.trim();

  if (trimmedSearch) {
    params.set("q", trimmedSearch);
  }

  if (view !== "all") {
    params.set("view", view);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function AdminListControls({
  basePath,
  searchLabel,
  searchPlaceholder,
  searchTerm,
  currentView,
  options,
}: AdminListControlsProps) {
  const router = useRouter();
  const [query, setQuery] = useState(searchTerm);
  const [isPending, startTransition] = useTransition();
  const inputId = `${basePath.replaceAll("/", "-").replace(/^-+/, "") || "admin"}-search`;

  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const hrefs = new Set(options.map((option) => buildAdminListHref(basePath, searchTerm, option.value)));
    hrefs.add(buildAdminListHref(basePath, "", "all"));

    hrefs.forEach((href) => {
      router.prefetch(href);
    });
  }, [basePath, options, router, searchTerm]);

  function navigate(nextQuery: string, nextView: string) {
    const href = buildAdminListHref(basePath, nextQuery, nextView);

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(query, currentView);
  }

  function handleClear() {
    setQuery("");
    navigate("", currentView);
  }

  return (
    <section className="admin-utility-bar p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <form className="flex flex-1 flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <label htmlFor={inputId} className="sr-only">
            {searchLabel}
          </label>
          <input
            id={inputId}
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="admin-input flex-1"
            autoComplete="off"
            placeholder={searchPlaceholder}
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
          >
            Search
          </button>
          {query.trim() ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-md border border-[#25344a] bg-[#1a2c44] px-4 py-2 text-sm font-bold text-white hover:bg-[#243654] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              Clear
            </button>
          ) : null}
        </form>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
          {options.map((option) => {
            const isActive = currentView === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => navigate(query, option.value)}
                disabled={isPending && isActive}
                aria-pressed={isActive}
                className={`${getAdminSegmentClass(isActive, option.tone)} shrink-0 whitespace-nowrap disabled:cursor-wait disabled:opacity-70`}
              >
                {option.label}
                <span className="ml-2 text-[#6c8096]">{option.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
