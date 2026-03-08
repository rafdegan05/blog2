"use client";

import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { useTranslation } from "@/components/LanguageProvider";

interface BlogContentProps {
  posts: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  search?: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
}

export default function BlogContent({
  posts,
  pagination,
  search,
  categories,
  tags,
}: BlogContentProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold">{t.blog.title}</h1>
          <p className="text-base-content/60 mt-2">
            {pagination.total === 1
              ? t.blog.articlesSingular.replace("{n}", String(pagination.total))
              : t.blog.articlesPlural.replace("{n}", String(pagination.total))}
          </p>
        </div>
        <SearchBar basePath="/blog" placeholder={t.blog.searchPlaceholder} />
      </div>

      <div className="mb-8">
        <FilterBar
          basePath="/blog"
          categories={categories}
          tags={tags}
          labels={{
            filterByCategory: t.blog.filterByCategory,
            filterByTag: t.blog.filterByTag,
            allCategories: t.blog.allCategories,
            allTags: t.blog.allTags,
            activeFilters: t.blog.activeFilters,
            clearFilters: t.blog.clearFilters,
          }}
        />
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">{t.blog.noPostsTitle}</h2>
          <p className="text-base-content/60">
            {search ? t.blog.noPostsSearch.replace("{search}", search) : t.blog.noPostsDefault}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug as string} post={post as never} />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            basePath="/blog"
          />
        </>
      )}
    </div>
  );
}
