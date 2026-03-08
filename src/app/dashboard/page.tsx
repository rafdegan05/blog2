"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "@/components/LanguageProvider";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  moderation?: string;
  createdAt: string;
  _count?: { comments: number };
}

interface PodcastItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  moderation?: string;
  createdAt: string;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "podcasts">("posts");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const role = session?.user?.role;
  const canCreate = role === "AUTHOR" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Admins see all content via moderation API, authors/users see public content
      if (isAdmin) {
        const res = await fetch("/api/admin/moderation");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
          setPodcasts(data.podcasts || []);
        }
      } else {
        const [postsRes, podcastsRes] = await Promise.all([
          fetch("/api/posts?limit=100"),
          fetch("/api/podcasts?limit=100"),
        ]);
        const postsData = await postsRes.json();
        const podcastsData = await podcastsRes.json();
        setPosts(postsData.posts || []);
        setPodcasts(podcastsData.podcasts || []);
      }
    } catch {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  const handleDeletePost = async (slug: string) => {
    if (!confirm(t.dashboard.deletePostConfirm)) return;
    await fetch(`/api/posts/${slug}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeletePodcast = async (slug: string) => {
    if (!confirm(t.dashboard.deletePodcastConfirm)) return;
    await fetch(`/api/podcasts/${slug}`, { method: "DELETE" });
    fetchData();
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">{t.dashboard.title}</h1>
        <p className="mb-4">{t.dashboard.signInText}</p>
        <Link href="/auth/signin" className="btn btn-primary">
          {t.common.signIn}
        </Link>
      </div>
    );
  }

  const moderationColor = (mod?: string) => {
    switch (mod) {
      case "APPROVED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "REJECTED":
        return "badge-error";
      case "FLAGGED":
        return "badge-error badge-outline";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {error === "insufficient_role" && (
        <div className="alert alert-warning mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span>{t.dashboard.roleWarning}</span>
        </div>
      )}
      {error === "admin_required" && (
        <div className="alert alert-error mb-6">
          <span>{t.dashboard.adminRequired}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
          <p className="text-base-content/60 mt-1">
            {t.dashboard.welcome}
            {session.user?.name || session.user?.email}
            {role && <span className="badge badge-primary badge-sm ml-2">{role}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canCreate && (
            <>
              <Link href="/blog/new" className="btn btn-primary btn-sm gap-1">
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
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Post
              </Link>
              <Link href="/podcasts/new" className="btn btn-secondary btn-sm gap-1">
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
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Podcast
              </Link>
            </>
          )}
          {isAdmin && (
            <Link href="/admin" className="btn btn-accent btn-sm btn-outline gap-1">
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
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-title">{t.dashboard.blogPosts}</div>
          <div className="stat-value text-primary text-2xl">{posts.length}</div>
        </div>
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-title">{t.dashboard.podcastsStat}</div>
          <div className="stat-value text-secondary text-2xl">{podcasts.length}</div>
        </div>
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-title">{t.dashboard.publishedStat}</div>
          <div className="stat-value text-success text-2xl">
            {posts.filter((p) => p.published).length + podcasts.filter((p) => p.published).length}
          </div>
        </div>
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-title">{t.dashboard.draftsStat}</div>
          <div className="stat-value text-warning text-2xl">
            {posts.filter((p) => !p.published).length + podcasts.filter((p) => !p.published).length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-boxed mb-6">
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "posts" ? "tab-active" : ""}`}
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
              strokeWidth="2"
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          {t.dashboard.postsTab.replace("{n}", String(posts.length))}
        </button>
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "podcasts" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("podcasts")}
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
              strokeWidth="2"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          {t.dashboard.podcastsTab.replace("{n}", String(podcasts.length))}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : activeTab === "posts" ? (
        <div className="overflow-x-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <p className="text-base-content/60 mb-4">{t.dashboard.noPostsYet}</p>
              {canCreate && (
                <Link href="/blog/new" className="btn btn-primary">
                  {t.dashboard.createFirstPost}
                </Link>
              )}
            </div>
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>{t.dashboard.tableTitle}</th>
                  <th>{t.dashboard.tableStatus}</th>
                  {isAdmin && (
                    <th className="hidden md:table-cell">{t.dashboard.tableModeration}</th>
                  )}
                  <th className="hidden md:table-cell">{t.dashboard.tableDate}</th>
                  <th className="hidden lg:table-cell">{t.dashboard.tableComments}</th>
                  <th>{t.dashboard.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${post.published ? "badge-success" : "badge-warning"}`}
                      >
                        {post.published ? t.common.published : t.common.draft}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="hidden md:table-cell">
                        <span className={`badge badge-sm ${moderationColor(post.moderation)}`}>
                          {post.moderation || t.dashboard.na}
                        </span>
                      </td>
                    )}
                    <td className="hidden md:table-cell text-sm text-base-content/60">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="hidden lg:table-cell text-sm">{post._count?.comments || 0}</td>
                    <td>
                      <div className="flex gap-1">
                        <Link
                          href={`/blog/edit/${post.slug}`}
                          className="btn btn-ghost btn-xs gap-1"
                          title="Edit"
                        >
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
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </Link>
                        <button
                          className="btn btn-error btn-outline btn-xs gap-1"
                          onClick={() => handleDeletePost(post.slug)}
                          title={t.common.delete}
                        >
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
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {podcasts.length === 0 ? (
            <div className="text-center py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <p className="text-base-content/60 mb-4">{t.dashboard.noPodcastsYet}</p>
              {canCreate && (
                <Link href="/podcasts/new" className="btn btn-secondary">
                  {t.dashboard.createFirstPodcast}
                </Link>
              )}
            </div>
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>{t.dashboard.tableTitle}</th>
                  <th>{t.dashboard.tableStatus}</th>
                  {isAdmin && (
                    <th className="hidden md:table-cell">{t.dashboard.tableModeration}</th>
                  )}
                  <th className="hidden md:table-cell">{t.dashboard.tableDate}</th>
                  <th>{t.dashboard.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {podcasts.map((podcast) => (
                  <tr key={podcast.id}>
                    <td>
                      <Link
                        href={`/podcasts/${podcast.slug}`}
                        className="font-medium hover:text-secondary transition-colors"
                      >
                        {podcast.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${podcast.published ? "badge-success" : "badge-warning"}`}
                      >
                        {podcast.published ? t.common.published : t.common.draft}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="hidden md:table-cell">
                        <span className={`badge badge-sm ${moderationColor(podcast.moderation)}`}>
                          {podcast.moderation || t.dashboard.na}
                        </span>
                      </td>
                    )}
                    <td className="hidden md:table-cell text-sm text-base-content/60">
                      {new Date(podcast.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link
                          href={`/podcasts/edit/${podcast.slug}`}
                          className="btn btn-ghost btn-xs gap-1"
                          title="Edit"
                        >
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
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </Link>
                        <button
                          className="btn btn-error btn-outline btn-xs gap-1"
                          onClick={() => handleDeletePodcast(podcast.slug)}
                          title={t.common.delete}
                        >
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
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
