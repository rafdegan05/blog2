"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";

interface PostCardProps {
  post: {
    slug: string;
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    createdAt: string;
    author: { name?: string | null; image?: string | null };
    categories: { name: string; slug: string }[];
    tags: { name: string; slug: string }[];
    _count?: { comments: number };
    readingTime?: number;
  };
  /** First card in the list – render as a larger featured layout */
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const readingTime = post.readingTime ?? 0;

  /* ── Featured / Hero card ── */
  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="post-card-featured">
          {/* Image */}
          {post.coverImage ? (
            <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl mb-6">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-base-100/60 to-transparent" />
            </div>
          ) : (
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-xl mb-6 bg-base-200 flex items-center justify-center">
              <svg
                className="w-16 h-16 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mb-3">
            {post.categories.length > 0 && (
              <span className="badge badge-primary badge-sm font-medium">
                {post.categories[0].name}
              </span>
            )}
            <span className="text-xs text-base-content/50">{formattedDate}</span>
            {readingTime > 0 && (
              <>
                <span className="text-xs text-base-content/30">·</span>
                <span className="text-xs text-base-content/50">
                  {t.common.minRead.replace("{n}", String(readingTime))}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors duration-200 leading-tight">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-base-content/60 text-lg leading-relaxed line-clamp-3 mb-4">
              {post.excerpt}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {post.author.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-base-content/70">
              {post.author.name || t.common.anonymous}
            </span>
          </div>
        </article>
      </Link>
    );
  }

  /* ── Regular card ── */
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="post-card h-full flex flex-col">
        {/* Cover image */}
        {post.coverImage ? (
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-4">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] rounded-lg mb-4 bg-base-200 flex items-center justify-center">
            <svg
              className="w-10 h-10 opacity-15"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {post.categories.length > 0 && (
            <span className="badge badge-primary badge-xs font-medium">
              {post.categories[0].name}
            </span>
          )}
          <span className="text-xs text-base-content/50">{formattedDate}</span>
          {readingTime > 0 && (
            <>
              <span className="text-xs text-base-content/30">·</span>
              <span className="text-xs text-base-content/50">
                {t.common.minRead.replace("{n}", String(readingTime))}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-200 leading-snug line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-base-content/60 leading-relaxed line-clamp-2 mb-3 flex-1">
            {post.excerpt}
          </p>
        )}

        {/* Footer: author + comments */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-base-200">
          <div className="flex items-center gap-2">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-medium">
                    {post.author.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-base-content/60">
              {post.author.name || t.common.anonymous}
            </span>
          </div>

          {post._count && post._count.comments > 0 && (
            <div className="flex items-center gap-1 text-xs text-base-content/50">
              <ChatIcon />
              <span>{post._count.comments}</span>
            </div>
          )}
        </div>

        {/* Extra tags (below footer, subtle) */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.slug}
                className="text-[10px] text-base-content/40 font-medium uppercase tracking-wider"
              >
                #{tag.name}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-[10px] text-base-content/30">+{post.tags.length - 3}</span>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}

/* ── Icons ── */

function ChatIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
