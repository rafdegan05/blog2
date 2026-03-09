"use client";

import Link from "next/link";
import Image from "next/image";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Comments from "@/components/Comments";
import EditButton from "@/components/EditButton";
import ReactionBar from "@/components/ReactionBar";
import ShareButtons from "@/components/ShareButtons";
import ScrollIndicator from "@/components/ScrollIndicator";
import { useTranslation } from "@/components/LanguageProvider";

interface PostDetailContentProps {
  post: {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    readingTime?: number;
    createdAt: string;
    updatedAt?: string;
    author: {
      id: string;
      name?: string;
      image?: string;
      bio?: string;
    };
    categories?: { slug: string; name: string }[];
    tags?: { slug: string; name: string }[];
    comments?: Record<string, unknown>[];
  };
}

export default function PostDetailContent({ post }: PostDetailContentProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const readingTime = post.readingTime ?? 0;

  return (
    <>
      <ScrollIndicator />

      {/* ── Cover image (full-bleed) ── */}
      {post.coverImage && (
        <div className="relative w-full max-h-[28rem] overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1920}
            height={1080}
            className="w-full h-auto object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent" />
        </div>
      )}

      <article className="post-detail max-w-3xl mx-auto px-4 pt-8 pb-16">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-sm text-base-content/50 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            {t.common.home}
          </Link>
          <ChevronIcon />
          <Link href="/blog" className="hover:text-primary transition-colors">
            {t.blog.title}
          </Link>
          <ChevronIcon />
          <span className="text-base-content/70 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* ── Header ── */}
        <header className="mb-10">
          {/* Categories (above title like Medium) */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/blog?category=${cat.slug}`}
                  className="badge badge-primary badge-sm font-medium hover:brightness-110 transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <div className="flex items-start gap-3 mb-5">
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight tracking-tight flex-1">
              {post.title}
            </h1>
            <EditButton href={`/blog/edit/${post.slug}`} authorId={post.author.id} />
          </div>

          {/* Subtitle / Excerpt */}
          {post.excerpt && (
            <p className="text-lg md:text-xl text-base-content/60 leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}

          {/* Author strip */}
          <div className="flex items-center gap-4 py-4 border-y border-base-200">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-11 h-11 rounded-full flex items-center justify-center overflow-hidden">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {post.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{post.author.name || t.common.anonymous}</div>
              <div className="flex items-center gap-2 text-xs text-base-content/50 flex-wrap">
                <span>{formattedDate}</span>
                {readingTime > 0 && (
                  <>
                    <span>·</span>
                    <span>{t.common.minRead.replace("{n}", String(readingTime))}</span>
                  </>
                )}
              </div>
            </div>

            {/* Share (compact, top-right) */}
            <ShareButtons
              title={post.title}
              url={typeof window !== "undefined" ? window.location.href : `/blog/${post.slug}`}
              description={post.excerpt}
            />
          </div>
        </header>

        {/* ── Article body ── */}
        <div className="post-body mb-12">
          <MarkdownRenderer content={post.content} />
        </div>

        {/* ── Tags ── */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-base-200">
            {post.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog?tag=${tag.slug}`}
                className="badge badge-outline badge-sm hover:badge-primary transition-all"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* ── Reactions ── */}
        <div className="mb-10">
          <ReactionBar postId={post.id} />
        </div>

        {/* ── Author bio card ── */}
        {post.author.bio && (
          <div className="post-author-card mb-12">
            <div className="flex items-start gap-4">
              <div className="avatar placeholder shrink-0">
                <div className="bg-neutral text-neutral-content w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
                  {post.author.image ? (
                    <Image
                      src={post.author.image}
                      alt=""
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-medium">
                      {post.author.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-base-content/40 mb-1">
                  {t.blog.writtenBy}
                </p>
                <h3 className="font-bold text-lg mb-1">{post.author.name}</h3>
                <p className="text-sm text-base-content/60 leading-relaxed">{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Comments ── */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Comments postId={post.id} initialComments={(post.comments || []) as any} />
      </article>
    </>
  );
}

/* ── Icons ── */

function ChevronIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 opacity-40 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
