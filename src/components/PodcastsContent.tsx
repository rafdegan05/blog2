"use client";

import PodcastCard from "@/components/PodcastCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

interface PodcastsContentProps {
  podcasts: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  search?: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
}

export default function PodcastsContent({
  podcasts,
  pagination,
  search,
  categories,
  tags,
}: PodcastsContentProps) {
  const { t } = useTranslation();

  const firstPodcast = podcasts[0];
  const restPodcasts = podcasts.slice(1);

  return (
    <div className="ted-page">
      {/* ── TED-style hero header ── */}
      <div className="ted-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <p className="ted-hero-label">{t.podcasts.heroLabel}</p>
              <h1 className="ted-hero-title">{t.podcasts.title}</h1>
              <p className="ted-hero-subtitle">
                {pagination.total === 1
                  ? t.podcasts.episodesSingular.replace("{n}", String(pagination.total))
                  : t.podcasts.episodesPlural.replace("{n}", String(pagination.total))}
              </p>
            </div>
            <SearchBar basePath="/podcasts" placeholder={t.podcasts.searchPlaceholder} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* ── Filters ── */}
        <div className="ted-filters">
          <FilterBar
            basePath="/podcasts"
            categories={categories}
            tags={tags}
            labels={{
              filterByCategory: t.podcasts.filterByCategory,
              filterByTag: t.podcasts.filterByTag,
              allCategories: t.podcasts.allCategories,
              allTags: t.podcasts.allTags,
              activeFilters: t.podcasts.activeFilters,
              clearFilters: t.podcasts.clearFilters,
            }}
          />
        </div>

        {podcasts.length === 0 ? (
          /* ── Empty state ── */
          <div className="ted-empty">
            <div className="ted-empty-icon">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.podcasts.noPodcastsTitle}</h2>
            <p className="text-base-content/50 max-w-md mx-auto">
              {search
                ? t.podcasts.noPodcastsSearch.replace("{search}", search)
                : t.podcasts.noPodcastsDefault}
            </p>
          </div>
        ) : (
          <>
            {/* ── Featured episode ── */}
            {firstPodcast && (
              <div className="mb-12">
                <PodcastCard podcast={firstPodcast as never} featured />
              </div>
            )}

            {/* ── Section title ── */}
            {restPodcasts.length > 0 && (
              <>
                <div className="ted-section-divider">
                  <h2 className="ted-section-title">{t.podcasts.allEpisodes}</h2>
                  <div className="ted-section-line" />
                </div>

                {/* ── Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {restPodcasts.map((podcast) => (
                    <PodcastCard key={podcast.slug as string} podcast={podcast as never} />
                  ))}
                </div>
              </>
            )}

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              basePath="/podcasts"
            />
          </>
        )}
      </div>
    </div>
  );
}
