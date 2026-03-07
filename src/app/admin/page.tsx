"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalPodcasts: number;
  pendingModeration: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") return;

    const fetchStats = async () => {
      try {
        const [usersRes, moderationRes] = await Promise.all([
          fetch("/api/user/role"),
          fetch("/api/admin/moderation?status=PENDING"),
        ]);

        const users = usersRes.ok ? await usersRes.json() : [];
        const moderation = moderationRes.ok
          ? await moderationRes.json()
          : { posts: [], podcasts: [] };

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalPosts: 0,
          totalPodcasts: 0,
          pendingModeration: (moderation.posts?.length || 0) + (moderation.podcasts?.length || 0),
        });

        // Fetch total posts/podcasts counts from moderation endpoint (all status)
        const allContentRes = await fetch("/api/admin/moderation");
        if (allContentRes.ok) {
          const allContent = await allContentRes.json();
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  totalPosts: allContent.posts?.length || 0,
                  totalPodcasts: allContent.podcasts?.length || 0,
                }
              : prev
          );
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-base-content/70 mb-4">You need admin privileges to access this page.</p>
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-base-content/60">Manage users, content, and moderation.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-primary">{stats?.totalUsers || 0}</div>
        </div>
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-figure text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
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
          </div>
          <div className="stat-title">Total Posts</div>
          <div className="stat-value text-secondary">{stats?.totalPosts || 0}</div>
        </div>
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-figure text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
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
          </div>
          <div className="stat-title">Total Podcasts</div>
          <div className="stat-value text-accent">{stats?.totalPodcasts || 0}</div>
        </div>
        <div className="stat bg-base-200 rounded-box shadow">
          <div className="stat-figure text-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="stat-title">Pending Review</div>
          <div className="stat-value text-warning">{stats?.pendingModeration || 0}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div className="card-body flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold">Manage Users</h3>
              <p className="text-sm text-base-content/60">View and update user roles</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/moderation"
          className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div className="card-body flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold">Content Moderation</h3>
              <p className="text-sm text-base-content/60">Review and manage content</p>
            </div>
          </div>
        </Link>
        <Link
          href="/dashboard"
          className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div className="card-body flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-info"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold">Dashboard</h3>
              <p className="text-sm text-base-content/60">Your personal dashboard</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
