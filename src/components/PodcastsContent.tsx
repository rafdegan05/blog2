"use client";

import PodcastCard from "@/components/PodcastCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold">{t.podcasts.title}</h1>
          <p className="text-base-content/60 mt-2">
            {pagination.total === 1
              ? t.podcasts.episodesSingular.replace("{n}", String(pagination.total))
              : t.podcasts.episodesPlural.replace("{n}", String(pagination.total))}
          </p>
        </div>
        <SearchBar basePath="/podcasts" placeholder={t.podcasts.searchPlaceholder} />
      </div>

      <div className="mb-8">
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
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold mb-2">{t.podcasts.noPodcastsTitle}</h2>
          <p className="text-base-content/60">
            {search
              ? t.podcasts.noPodcastsSearch.replace("{search}", search)
              : t.podcasts.noPodcastsDefault}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.slug as string} podcast={podcast as never} />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            basePath="/podcasts"
          />
        </>
      )}
    </div>
  );
}
