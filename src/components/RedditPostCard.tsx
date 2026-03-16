"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";

interface RedditPostCardProps {
  post: {
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
  };
}

export default function RedditPostCard({ post }: RedditPostCardProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const readingTime = post.readingTime ?? 0;
  const reactionCount = post._count?.reactions ?? 0;
  const commentCount = post._count?.comments ?? 0;

  return (
    <article className="reddit-post-card group">
      {/* Vote column */}
      <div className="reddit-vote-col">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-base-content/30 hover:text-primary transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
        <span className="text-xs font-bold text-base-content/70">{reactionCount}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-base-content/30 hover:text-error transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Thumbnail */}
      {post.coverImage && (
        <Link href={`/blog/${post.slug}`} className="reddit-thumb">
          <Image
            src={post.coverImage}
            alt=""
            width={128}
            height={96}
            className="object-cover w-full h-full rounded"
          />
        </Link>
      )}

      {/* Content */}
      <div className="reddit-post-content">
        {/* Top meta line */}
        <div className="flex items-center gap-2 text-xs text-base-content/50 flex-wrap">
          {post.categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog?category=${cat.slug}`}
              className="badge badge-primary badge-xs hover:brightness-110"
            >
              {cat.name}
            </Link>
          ))}
          <span>·</span>
          <span>{t.userProfile.postedBy}</span>
          {post.author.id ? (
            <Link
              href={`/u/${post.author.id}`}
              className="font-medium hover:underline text-base-content/70"
            >
              u/{post.author.name?.toLowerCase().replace(/\s+/g, "_") || t.common.anonymous}
            </Link>
          ) : (
            <span className="font-medium text-base-content/70">
              {post.author.name || t.common.anonymous}
            </span>
          )}
          <span>{formattedDate}</span>
          {readingTime > 0 && (
            <>
              <span>·</span>
              <span>{t.common.minRead.replace("{n}", String(readingTime))}</span>
            </>
          )}
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 mt-1">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-base-content/50 line-clamp-2 mt-1">{post.excerpt}</p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog?tag=${tag.slug}`}
                className="text-xs text-primary/60 hover:text-primary transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Bottom action bar */}
        <div className="reddit-action-bar">
          <Link href={`/blog/${post.slug}`} className="reddit-action-btn">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>
              {commentCount} {t.userProfile.commentsLabel}
            </span>
          </Link>

          <button
            className="reddit-action-btn"
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(window.location.origin + `/blog/${post.slug}`);
            }}
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>{t.userProfile.share}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
