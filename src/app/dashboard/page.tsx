"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  _count?: { comments: number };
}

interface PodcastItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
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

  const role = session?.user?.role;
  const canCreate = role === "AUTHOR" || role === "ADMIN";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, podcastsRes] = await Promise.all([
        fetch("/api/posts?limit=100"),
        fetch("/api/podcasts?limit=100"),
      ]);
      const postsData = await postsRes.json();
      const podcastsData = await podcastsRes.json();
      setPosts(postsData.posts || []);
      setPodcasts(podcastsData.podcasts || []);
    } catch {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  const handleDeletePost = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    await fetch(`/api/posts/${slug}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeletePodcast = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this podcast?")) return;
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
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="mb-4">Sign in to access the dashboard.</p>
        <Link href="/auth/signin" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

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
          <span>
            You need Author or Admin role to create content. Contact an administrator to upgrade
            your account.
          </span>
        </div>
      )}
      {error === "admin_required" && (
        <div className="alert alert-error mb-6">
          <span>Admin access is required for that page.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-base-content/60 mt-1">
            Welcome, {session.user?.name || session.user?.email}
            {role && <span className="badge badge-primary badge-sm ml-2">{role}</span>}
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Link href="/blog/new" className="btn btn-primary btn-sm">
              + New Post
            </Link>
            <Link href="/podcasts/new" className="btn btn-secondary btn-sm">
              + New Podcast
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats shadow mb-8 w-full">
        <div className="stat">
          <div className="stat-title">Blog Posts</div>
          <div className="stat-value text-primary">{posts.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Podcasts</div>
          <div className="stat-value text-secondary">{podcasts.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === "posts" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          📝 Posts ({posts.length})
        </button>
        <button
          className={`tab ${activeTab === "podcasts" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("podcasts")}
        >
          🎙️ Podcasts ({podcasts.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : activeTab === "posts" ? (
        <div className="overflow-x-auto">
          {posts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-base-content/60 mb-4">No posts yet.</p>
              <Link href="/blog/new" className="btn btn-primary">
                Create your first post
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Comments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link href={`/blog/${post.slug}`} className="link link-primary">
                        {post.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${post.published ? "badge-success" : "badge-warning"}`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>{post._count?.comments || 0}</td>
                    <td>
                      <button
                        className="btn btn-error btn-xs"
                        onClick={() => handleDeletePost(post.slug)}
                      >
                        Delete
                      </button>
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
            <div className="text-center py-10">
              <p className="text-base-content/60 mb-4">No podcasts yet.</p>
              <Link href="/podcasts/new" className="btn btn-secondary">
                Create your first podcast
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {podcasts.map((podcast) => (
                  <tr key={podcast.id}>
                    <td>
                      <Link href={`/podcasts/${podcast.slug}`} className="link link-secondary">
                        {podcast.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${podcast.published ? "badge-success" : "badge-warning"}`}
                      >
                        {podcast.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>{new Date(podcast.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-error btn-xs"
                        onClick={() => handleDeletePodcast(podcast.slug)}
                      >
                        Delete
                      </button>
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
