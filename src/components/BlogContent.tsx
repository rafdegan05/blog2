"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import { useTranslation } from "@/components/LanguageProvider";

type ViewMode = "feed" | "grid";
type SortMode = "latest" | "popular" | "discussed";

interface Post {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  createdAt: string;
  author: { id?: string; name?: string | null; image?: string | null };
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  _count?: { comments: number; reactions?: number };
  readingTime?: number;
}

interface BlogContentProps {
  posts: Post[];
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("feed");

  const activeSort = (searchParams.get("sort") as SortMode) || "latest";
  const activeCategory = searchParams.get("category") || "";
  const activeTag = searchParams.get("tag") || "";

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  function setSort(sort: SortMode) {
    router.push(buildUrl({ sort: sort === "latest" ? "" : sort }));
  }

  function clearFilters() {
    router.push(buildUrl({ category: "", tag: "", search: "" }));
  }

  const hasFilters = activeCategory || activeTag;

  return (
    <div className="engage-blog-container">
      {/* ── Header ── */}
      <header className="engage-blog-header">
        <div className="engage-blog-header-text">
          <h1 className="engage-blog-title">{t.blog.title}</h1>
          <p className="engage-blog-subtitle">
            {pagination.total === 1
              ? t.blog.articlesSingular.replace("{n}", String(pagination.total))
              : t.blog.articlesPlural.replace("{n}", String(pagination.total))}
          </p>
        </div>
        <div className="engage-blog-header-actions">
          <SearchBar basePath="/blog" placeholder={t.blog.searchPlaceholder} />
        </div>
      </header>

      {/* ── Toolbar: Sort tabs + View toggle + Filters ── */}
      <div className="engage-toolbar">
        <div className="engage-toolbar-left">
          <div className="engage-sort-tabs">
            <button
              className={`engage-sort-tab ${activeSort === "latest" ? "engage-sort-tab-active" : ""}`}
              onClick={() => setSort("latest")}
            >
              <ClockIcon />
              {t.blog.sortLatest}
            </button>
            <button
              className={`engage-sort-tab ${activeSort === "popular" ? "engage-sort-tab-active" : ""}`}
              onClick={() => setSort("popular")}
            >
              <FireIcon />
              {t.blog.sortPopular}
            </button>
            <button
              className={`engage-sort-tab ${activeSort === "discussed" ? "engage-sort-tab-active" : ""}`}
              onClick={() => setSort("discussed")}
            >
              <ChatBubbleIcon />
              {t.blog.sortDiscussed}
            </button>
          </div>

          {categories.length > 0 && (
            <select
              className="engage-filter-select"
              value={activeCategory}
              onChange={(e) => router.push(buildUrl({ category: e.target.value }))}
            >
              <option value="">{t.blog.allCategories}</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          {tags.length > 0 && (
            <select
              className="engage-filter-select"
              value={activeTag}
              onChange={(e) => router.push(buildUrl({ tag: e.target.value }))}
            >
              <option value="">{t.blog.allTags}</option>
              {tags.map((tag) => (
                <option key={tag.slug} value={tag.slug}>
                  {tag.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="engage-toolbar-right">
          {hasFilters && (
            <div className="engage-active-filters">
              {activeCategory && (
                <button
                  onClick={() => router.push(buildUrl({ category: "" }))}
                  className="engage-filter-badge"
                >
                  {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
                  <XIcon />
                </button>
              )}
              {activeTag && (
                <button
                  onClick={() => router.push(buildUrl({ tag: "" }))}
                  className="engage-filter-badge"
                >
                  #{tags.find((tg) => tg.slug === activeTag)?.name || activeTag}
                  <XIcon />
                </button>
              )}
              <button onClick={clearFilters} className="engage-clear-btn">
                {t.blog.clearFilters}
              </button>
            </div>
          )}

          <div className="engage-view-toggle">
            <button
              className={`engage-view-btn ${viewMode === "feed" ? "engage-view-btn-active" : ""}`}
              onClick={() => setViewMode("feed")}
              title={t.blog.viewReddit}
            >
              <ListIcon />
            </button>
            <button
              className={`engage-view-btn ${viewMode === "grid" ? "engage-view-btn-active" : ""}`}
              onClick={() => setViewMode("grid")}
              title={t.blog.viewCards}
            >
              <GridIcon />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="engage-blog-layout">
        <main className="engage-blog-main">
          {posts.length === 0 ? (
            <div className="engage-empty-state">
              <div className="engage-empty-icon">📝</div>
              <h2 className="engage-empty-title">{t.blog.noPostsTitle}</h2>
              <p className="engage-empty-text">
                {search ? t.blog.noPostsSearch.replace("{search}", search) : t.blog.noPostsDefault}
              </p>
            </div>
          ) : viewMode === "feed" ? (
            <div className="engage-feed">
              {posts.map((post) => (
                <FeedCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="engage-grid">
              {posts.map((post) => (
                <GridCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              basePath="/blog"
            />
          )}
        </main>

        {/* Sidebar */}
        <aside className="engage-sidebar">
          <div className="engage-sidebar-card">
            <h3 className="engage-sidebar-heading">
              <InfoIcon />
              {t.blog.communityInfo}
            </h3>
            <p className="engage-sidebar-text">{t.blog.communityDesc}</p>
            <div className="engage-sidebar-stats">
              <div className="engage-sidebar-stat">
                <span className="engage-sidebar-stat-value">{pagination.total}</span>
                <span className="engage-sidebar-stat-label">{t.blog.totalPosts}</span>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="engage-sidebar-card">
              <h3 className="engage-sidebar-heading">
                <FolderIcon />
                {t.blog.filterByCategory}
              </h3>
              <div className="engage-sidebar-tags">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={buildUrl({ category: cat.slug })}
                    className={`engage-sidebar-tag ${activeCategory === cat.slug ? "engage-sidebar-tag-active" : ""}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="engage-sidebar-card">
              <h3 className="engage-sidebar-heading">
                <TagIcon />
                {t.blog.filterByTag}
              </h3>
              <div className="engage-sidebar-tags">
                {tags.slice(0, 15).map((tag) => (
                  <Link
                    key={tag.slug}
                    href={buildUrl({ tag: tag.slug })}
                    className={`engage-sidebar-tag ${activeTag === tag.slug ? "engage-sidebar-tag-active" : ""}`}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Feed Card — Reddit/Engage hybrid list item
   ═══════════════════════════════════════════════════════ */
function FeedCard({ post }: { post: Post }) {
  const { t } = useTranslation();
  const readingTime = post.readingTime ?? 0;
  const reactionCount = post._count?.reactions ?? 0;
  const commentCount = post._count?.comments ?? 0;

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="engage-feed-card">
      <div className="engage-feed-meta">
        <div className="engage-feed-avatar">
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt=""
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <span>{post.author.name?.charAt(0)?.toUpperCase() || "?"}</span>
          )}
        </div>
        {post.author.id ? (
          <Link href={`/u/${post.author.id}`} className="engage-feed-author">
            {post.author.name || t.common.anonymous}
          </Link>
        ) : (
          <span className="engage-feed-author">{post.author.name || t.common.anonymous}</span>
        )}
        {post.categories.length > 0 && (
          <>
            <span className="engage-feed-dot">in</span>
            <Link
              href={`/blog?category=${post.categories[0].slug}`}
              className="engage-feed-community"
            >
              {post.categories[0].name}
            </Link>
          </>
        )}
        <span className="engage-feed-dot">·</span>
        <span className="engage-feed-date">{formattedDate}</span>
        {readingTime > 0 && (
          <>
            <span className="engage-feed-dot">·</span>
            <span className="engage-feed-date">
              {t.common.minRead.replace("{n}", String(readingTime))}
            </span>
          </>
        )}
      </div>

      <div className="engage-feed-body">
        <div className="engage-feed-text">
          <Link href={`/blog/${post.slug}`} className="engage-feed-title-link">
            <h3 className="engage-feed-title">{post.title}</h3>
          </Link>
          {post.excerpt && <p className="engage-feed-excerpt">{post.excerpt}</p>}
          {post.tags.length > 0 && (
            <div className="engage-feed-tags">
              {post.tags.slice(0, 4).map((tag) => (
                <Link key={tag.slug} href={`/blog?tag=${tag.slug}`} className="engage-tag-pill">
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        {post.coverImage && (
          <Link href={`/blog/${post.slug}`} className="engage-feed-thumb">
            <Image
              src={post.coverImage}
              alt=""
              width={180}
              height={120}
              className="object-cover w-full h-full"
            />
          </Link>
        )}
      </div>

      <div className="engage-feed-actions">
        <div className="engage-action-btn engage-action-reactions">
          <HeartIcon />
          <span>{reactionCount}</span>
        </div>
        <Link href={`/blog/${post.slug}#comments`} className="engage-action-btn">
          <CommentIcon />
          <span>
            {commentCount} {t.userProfile.commentsLabel}
          </span>
        </Link>
        <button
          className="engage-action-btn"
          onClick={() =>
            navigator.clipboard.writeText(window.location.origin + `/blog/${post.slug}`)
          }
        >
          <ShareIcon />
          <span>{t.userProfile.share}</span>
        </button>
        <Link href={`/blog/${post.slug}`} className="engage-action-btn engage-action-read">
          {t.blog.readMore} →
        </Link>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════
   Grid Card — Microsoft Engage-style card
   ═══════════════════════════════════════════════════════ */
function GridCard({ post }: { post: Post }) {
  const { t } = useTranslation();
  const readingTime = post.readingTime ?? 0;
  const reactionCount = post._count?.reactions ?? 0;
  const commentCount = post._count?.comments ?? 0;

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article className="engage-grid-card">
        <div className="engage-grid-image">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="engage-grid-placeholder">
              <DocumentIcon />
            </div>
          )}
          {post.categories.length > 0 && (
            <span className="engage-grid-badge">{post.categories[0].name}</span>
          )}
        </div>

        <div className="engage-grid-body">
          <h3 className="engage-grid-title">{post.title}</h3>
          {post.excerpt && <p className="engage-grid-excerpt">{post.excerpt}</p>}

          <div className="engage-grid-footer">
            <div className="engage-grid-author">
              <div className="engage-grid-avatar">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span>{post.author.name?.charAt(0)?.toUpperCase() || "?"}</span>
                )}
              </div>
              <span className="engage-grid-author-name">
                {post.author.name || t.common.anonymous}
              </span>
            </div>
            <div className="engage-grid-meta">
              <span>{formattedDate}</span>
              {readingTime > 0 && (
                <span>· {t.common.minRead.replace("{n}", String(readingTime))}</span>
              )}
            </div>
          </div>

          <div className="engage-grid-stats">
            <span className="engage-grid-stat">
              <HeartIcon /> {reactionCount}
            </span>
            <span className="engage-grid-stat">
              <CommentIcon /> {commentCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════ */
function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function FireIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
      />
    </svg>
  );
}
function ChatBubbleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
      />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}
function DocumentIcon() {
  return (
    <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
      />
    </svg>
  );
}
