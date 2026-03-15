"use client";

import { useState } from "react";
import PostCard from "@/components/PostCard";
import RedditPostCard from "@/components/RedditPostCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { useTranslation } from "@/components/LanguageProvider";

type ViewMode = "reddit" | "cards";

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
  const [viewMode, setViewMode] = useState<ViewMode>("reddit");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold">{t.blog.title}</h1>
          <p className="text-base-content/60 mt-2">
            {pagination.total === 1
              ? t.blog.articlesSingular.replace("{n}", String(pagination.total))
              : t.blog.articlesPlural.replace("{n}", String(pagination.total))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar basePath="/blog" placeholder={t.blog.searchPlaceholder} />
          {/* View toggle */}
          <div className="btn-group join">
            <button
              className={`btn btn-sm join-item ${viewMode === "reddit" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewMode("reddit")}
              title={t.blog.viewReddit}
            >
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
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <button
              className={`btn btn-sm join-item ${viewMode === "cards" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewMode("cards")}
              title={t.blog.viewCards}
            >
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
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
          </div>
        </div>
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
      ) : viewMode === "reddit" ? (
        <>
          <div className="space-y-2">
            {posts.map((post) => (
              <RedditPostCard key={post.slug as string} post={post as never} />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            basePath="/blog"
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <div
                key={post.slug as string}
                className={i === 0 && pagination.page === 1 ? "col-span-full" : ""}
              >
                <PostCard post={post as never} featured={i === 0 && pagination.page === 1} />
              </div>
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
