"use client";

import Link from "next/link";
import Image from "next/image";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Comments from "@/components/Comments";
import EditButton from "@/components/EditButton";
import ReactionBar from "@/components/ReactionBar";
import ShareButtons from "@/components/ShareButtons";
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li>
            <Link href="/">{t.common.home}</Link>
          </li>
          <li>
            <Link href="/blog">{t.blog.title}</Link>
          </li>
          <li>{post.title}</li>
        </ul>
      </div>

      {/* Cover Image */}
      {post.coverImage && (
        <figure className="relative mb-8 h-64 md:h-96">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover rounded-xl"
            priority
          />
        </figure>
      )}

      {/* Post Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <EditButton href={`/blog/edit/${post.slug}`} authorId={post.author.id} />
        </div>

        <div className="flex items-center gap-4 text-base-content/60 mb-4">
          <div className="flex items-center gap-2">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-8 rounded-full flex items-center justify-center">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-xs">
                    {post.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>
            <span className="font-medium">{post.author.name || t.common.anonymous}</span>
          </div>
          <span>·</span>
          <span>
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {post.readingTime && (
            <>
              <span>·</span>
              <span>{t.common.minRead.replace("{n}", String(post.readingTime))}</span>
            </>
          )}
        </div>

        {/* Tags and Categories */}
        <div className="flex flex-wrap gap-2">
          {post.categories?.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog?category=${cat.slug}`}
              className="badge badge-primary"
            >
              {cat.name}
            </Link>
          ))}
          {post.tags?.map((tag) => (
            <Link key={tag.slug} href={`/blog?tag=${tag.slug}`} className="badge badge-outline">
              {tag.name}
            </Link>
          ))}
        </div>
      </header>

      {/* Post Content */}
      <article className="divider" />
      <MarkdownRenderer content={post.content} />

      {/* Reactions & Share */}
      <div className="mt-8 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ReactionBar postId={post.id} />
        <ShareButtons
          title={post.title}
          url={typeof window !== "undefined" ? window.location.href : `/blog/${post.slug}`}
          description={post.excerpt}
        />
      </div>

      {/* Author Bio */}
      {post.author.bio && (
        <div className="card bg-base-200 mt-8">
          <div className="card-body flex-row items-center gap-4">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-16 rounded-full flex items-center justify-center">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-xl">
                    {post.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold">{post.author.name}</h3>
              <p className="text-base-content/60">{post.author.bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Comments postId={post.id} initialComments={(post.comments || []) as any} />
    </div>
  );
}
