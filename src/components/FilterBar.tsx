"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterBarProps {
  basePath: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  labels: {
    filterByCategory: string;
    filterByTag: string;
    allCategories: string;
    allTags: string;
    activeFilters: string;
    clearFilters: string;
  };
}

export default function FilterBar({ basePath, categories, tags, labels }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";
  const activeTag = searchParams.get("tag") || "";
  const hasFilters = activeCategory || activeTag;

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page"); // reset pagination on filter change

      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const qs = params.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [searchParams, basePath]
  );

  const handleCategoryChange = useCallback(
    (slug: string) => {
      router.push(buildUrl({ category: slug }));
    },
    [router, buildUrl]
  );

  const handleTagChange = useCallback(
    (slug: string) => {
      router.push(buildUrl({ tag: slug }));
    },
    [router, buildUrl]
  );

  const clearAll = useCallback(() => {
    router.push(buildUrl({ category: "", tag: "" }));
  }, [router, buildUrl]);

  if (categories.length === 0 && tags.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Category filter */}
        {categories.length > 0 && (
          <select
            className="select select-bordered select-sm"
            value={activeCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label={labels.filterByCategory}
          >
            <option value="">{labels.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        )}

        {/* Tag filter */}
        {tags.length > 0 && (
          <select
            className="select select-bordered select-sm"
            value={activeTag}
            onChange={(e) => handleTagChange(e.target.value)}
            aria-label={labels.filterByTag}
          >
            <option value="">{labels.allTags}</option>
            {tags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters button */}
        {hasFilters && (
          <button onClick={clearAll} className="btn btn-ghost btn-sm gap-1 text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {labels.clearFilters}
          </button>
        )}
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-base-content/50">{labels.activeFilters}:</span>
          {activeCategory && (
            <button
              onClick={() => handleCategoryChange("")}
              className="badge badge-primary gap-1 cursor-pointer hover:badge-error transition-colors"
            >
              {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {activeTag && (
            <button
              onClick={() => handleTagChange("")}
              className="badge badge-outline gap-1 cursor-pointer hover:badge-error transition-colors"
            >
              {tags.find((t) => t.slug === activeTag)?.name || activeTag}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
