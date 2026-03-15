"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/components/LanguageProvider";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface UserPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  createdAt: string;
  readingTime?: number;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  _count: { comments: number; reactions: number };
}

interface UserComment {
  id: string;
  content: string;
  createdAt: string;
  post: { title: string; slug: string } | null;
}

interface UserProfileData {
  id: string;
  name: string | null;
  image: string | null;
  bannerImage: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
  _count: { posts: number; podcasts: number; comments: number };
  posts: UserPost[];
  comments: UserComment[];
}

type Tab = "posts" | "comments" | "about";

export default function UserProfileContent({ profile }: { profile: UserProfileData }) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const isOwnProfile = session?.user?.id === profile.id;
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ── Profile Banner ── */}
      <div className="reddit-profile-banner">
        {profile.bannerImage ? (
          <div
            className="reddit-profile-banner-bg"
            style={{ position: "relative", overflow: "hidden" }}
          >
            <Image src={profile.bannerImage} alt="Banner" fill className="object-cover" />
          </div>
        ) : (
          <div className="reddit-profile-banner-bg" />
        )}
        <div className="reddit-profile-header">
          {/* Avatar */}
          <div className={`reddit-avatar ${!profile.image ? "placeholder" : ""}`}>
            <div className="reddit-avatar-inner">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name || "User"}
                  width={96}
                  height={96}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-content">
                  {profile.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
          </div>

          {/* Name & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{profile.name || t.common.anonymous}</h1>
              <span className="badge badge-primary badge-sm">{profile.role}</span>
              {isOwnProfile && (
                <Link href="/profile" className="btn btn-ghost btn-xs gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {t.common.edit}
                </Link>
              )}
            </div>
            <p className="text-sm text-base-content/50 mt-1">
              u/{profile.name?.toLowerCase().replace(/\s+/g, "_") || profile.id}
              {" · "}
              {t.userProfile.memberSince} {memberSince}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="reddit-stats-bar">
          <div className="reddit-stat">
            <span className="reddit-stat-value">{profile._count.posts}</span>
            <span className="reddit-stat-label">{t.userProfile.posts}</span>
          </div>
          <div className="reddit-stat-divider" />
          <div className="reddit-stat">
            <span className="reddit-stat-value">{profile._count.comments}</span>
            <span className="reddit-stat-label">{t.userProfile.commentsLabel}</span>
          </div>
          <div className="reddit-stat-divider" />
          <div className="reddit-stat">
            <span className="reddit-stat-value">{profile._count.podcasts}</span>
            <span className="reddit-stat-label">{t.userProfile.podcasts}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="reddit-tabs">
        <button
          className={`reddit-tab ${activeTab === "posts" ? "reddit-tab-active" : ""}`}
          onClick={() => setActiveTab("posts")}
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
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          {t.userProfile.posts}
        </button>
        <button
          className={`reddit-tab ${activeTab === "comments" ? "reddit-tab-active" : ""}`}
          onClick={() => setActiveTab("comments")}
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {t.userProfile.commentsLabel}
        </button>
        <button
          className={`reddit-tab ${activeTab === "about" ? "reddit-tab-active" : ""}`}
          onClick={() => setActiveTab("about")}
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t.userProfile.about}
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="mt-4">
        {activeTab === "posts" && <PostsTab posts={profile.posts} />}
        {activeTab === "comments" && (
          <CommentsTab comments={profile.comments} userName={profile.name} />
        )}
        {activeTab === "about" && <AboutTab profile={profile} />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   Posts Tab – Reddit-style compact cards
   ────────────────────────────────────── */

function PostsTab({ posts }: { posts: UserPost[] }) {
  const { t } = useTranslation();

  if (posts.length === 0) {
    return (
      <div className="reddit-empty-state">
        <div className="text-5xl mb-3">📝</div>
        <p className="text-base-content/50">{t.userProfile.noPosts}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <RedditPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function RedditPostCard({ post }: { post: UserPost }) {
  const { t } = useTranslation();
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const readingTime = post.readingTime ?? 0;

  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <article className="reddit-post-card group">
        {/* Vote column */}
        <div className="reddit-vote-col">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-base-content/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-xs font-bold text-base-content/70">{post._count.reactions}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-base-content/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Thumbnail */}
        {post.coverImage && (
          <div className="reddit-thumb">
            <Image
              src={post.coverImage}
              alt=""
              width={96}
              height={72}
              className="object-cover w-full h-full rounded"
            />
          </div>
        )}

        {/* Content */}
        <div className="reddit-post-content">
          {/* Category badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {post.categories.map((cat) => (
              <span key={cat.slug} className="badge badge-primary badge-xs">
                {cat.name}
              </span>
            ))}
          </div>

          <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-sm text-base-content/50 line-clamp-1 mt-0.5">{post.excerpt}</p>
          )}

          {/* Footer meta */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-base-content/40">
            <span>{formattedDate}</span>
            {readingTime > 0 && (
              <>
                <span>·</span>
                <span>{t.common.minRead.replace("{n}", String(readingTime))}</span>
              </>
            )}
            <span>·</span>
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
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
              {post._count.comments}
            </span>
            {post.tags.length > 0 && (
              <>
                <span>·</span>
                <div className="flex gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag.slug} className="text-primary/60">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ──────────────────────────────────────
   Comments Tab
   ────────────────────────────────────── */

function CommentsTab({ comments, userName }: { comments: UserComment[]; userName: string | null }) {
  const { t } = useTranslation();
  const [now] = useState(() => Date.now());

  function relativeTime(iso: string) {
    const diff = now - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return t.userProfile.justNow;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return new Date(iso).toLocaleDateString();
  }

  if (comments.length === 0) {
    return (
      <div className="reddit-empty-state">
        <div className="text-5xl mb-3">💬</div>
        <p className="text-base-content/50">{t.userProfile.noComments}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div key={comment.id} className="reddit-comment-card">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
            <span className="font-medium text-base-content/70">
              {userName || t.common.anonymous}
            </span>
            <span>·</span>
            <span>{relativeTime(comment.createdAt)}</span>
            {comment.post && (
              <>
                <span>·</span>
                <span>{t.userProfile.commentedOn}</span>
                <Link
                  href={`/blog/${comment.post.slug}`}
                  className="font-medium text-primary hover:underline truncate max-w-[200px]"
                >
                  {comment.post.title}
                </Link>
              </>
            )}
          </div>

          {/* Content */}
          <div className="reddit-comment-body">
            <MarkdownRenderer content={comment.content} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────
   About Tab
   ────────────────────────────────────── */

function AboutTab({ profile }: { profile: UserProfileData }) {
  const { t } = useTranslation();
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Bio */}
      <div className="reddit-about-card col-span-full">
        <h3 className="font-bold text-lg mb-3">{t.userProfile.bio}</h3>
        {profile.bio ? (
          <div className="prose prose-sm max-w-none text-base-content/70">
            <MarkdownRenderer content={profile.bio} />
          </div>
        ) : (
          <p className="text-base-content/40 italic">{t.userProfile.noBio}</p>
        )}
      </div>

      {/* Trophy / Stats Cards */}
      <div className="reddit-about-card">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          {t.userProfile.achievements}
        </h3>
        <div className="space-y-2">
          {profile._count.posts >= 1 && (
            <div className="flex items-center gap-2 text-sm">
              <span>📝</span>
              <span>{t.userProfile.achieveFirstPost}</span>
            </div>
          )}
          {profile._count.posts >= 10 && (
            <div className="flex items-center gap-2 text-sm">
              <span>🔥</span>
              <span>{t.userProfile.achieveProlific}</span>
            </div>
          )}
          {profile._count.comments >= 10 && (
            <div className="flex items-center gap-2 text-sm">
              <span>💬</span>
              <span>{t.userProfile.achieveCommenter}</span>
            </div>
          )}
          {profile._count.podcasts >= 1 && (
            <div className="flex items-center gap-2 text-sm">
              <span>🎙️</span>
              <span>{t.userProfile.achievePodcaster}</span>
            </div>
          )}
          {profile._count.posts === 0 &&
            profile._count.comments === 0 &&
            profile._count.podcasts === 0 && (
              <p className="text-base-content/40 text-sm italic">{t.userProfile.noAchievements}</p>
            )}
        </div>
      </div>

      <div className="reddit-about-card">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-info"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {t.userProfile.info}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-base-content/50">{t.userProfile.joined}</span>
            <span className="font-medium">{memberSince}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/50">{t.userProfile.role}</span>
            <span className="badge badge-sm badge-primary">{profile.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
