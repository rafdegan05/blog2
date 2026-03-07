"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  moderation: string;
  flagReason: string | null;
  createdAt: string;
  author: { id: string; name: string | null; email: string | null; image: string | null };
  categories: { name: string }[];
  tags: { name: string }[];
  _count?: { comments: number };
}

type ContentType = "all" | "posts" | "podcasts";
type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

export default function AdminModerationPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [podcasts, setPodcasts] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<ContentType>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [flagModal, setFlagModal] = useState<{ id: string; type: "post" | "podcast" } | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const fetchContent = async () => {
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (activeType !== "all") params.set("type", activeType);

      const res = await fetch(`/api/admin/moderation?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setPodcasts(data.podcasts || []);
      }
    } catch {
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") return;
    setLoading(true);
    fetchContent();
  }, [session, status, activeType, activeStatus]);

  const handleModeration = async (
    id: string,
    type: "post" | "podcast",
    newStatus: string,
    reason?: string
  ) => {
    setUpdating(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type,
          status: newStatus,
          flagReason: reason || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update status");
        return;
      }

      setSuccess(`Content ${newStatus.toLowerCase()} successfully`);
      setTimeout(() => setSuccess(""), 3000);

      // Update local state
      const updateItem = (items: ContentItem[]) =>
        items.map((item) =>
          item.id === id ? { ...item, moderation: newStatus, flagReason: reason || null } : item
        );

      if (type === "post") setPosts(updateItem);
      else setPodcasts(updateItem);
    } catch {
      setError("An error occurred");
    } finally {
      setUpdating(null);
      setFlagModal(null);
      setFlagReason("");
    }
  };

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

  const statusColor = (s: string) => {
    switch (s) {
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

  const allContent = [
    ...posts.map((p) => ({ ...p, contentType: "post" as const })),
    ...podcasts.map((p) => ({ ...p, contentType: "podcast" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="btn btn-ghost btn-sm">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-base-content/60">{allContent.length} items</p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-1">
          <span className="text-sm font-semibold text-base-content/60 self-center mr-2">Type:</span>
          {(["all", "posts", "podcasts"] as ContentType[]).map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${activeType === t ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveType(t)}
            >
              {t === "all" ? "All" : t === "posts" ? "Posts" : "Podcasts"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="text-sm font-semibold text-base-content/60 self-center mr-2">
            Status:
          </span>
          {(["all", "PENDING", "APPROVED", "REJECTED", "FLAGGED"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${activeStatus === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveStatus(s)}
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {allContent.map((item) => (
          <div key={`${item.contentType}-${item.id}`} className="card bg-base-200 shadow">
            <div className="card-body p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`badge badge-sm ${item.contentType === "post" ? "badge-secondary" : "badge-accent"}`}
                    >
                      {item.contentType === "post" ? "Post" : "Podcast"}
                    </span>
                    <span className={`badge badge-sm ${statusColor(item.moderation)}`}>
                      {item.moderation}
                    </span>
                    {!item.published && <span className="badge badge-sm badge-outline">Draft</span>}
                  </div>
                  <Link
                    href={
                      item.contentType === "post" ? `/blog/${item.slug}` : `/podcasts/${item.slug}`
                    }
                    className="font-bold text-lg hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-base-content/60 mt-1">
                    <span>by {item.author.name || item.author.email || "Unknown"}</span>
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item._count?.comments !== undefined && (
                      <>
                        <span>·</span>
                        <span>{item._count.comments} comments</span>
                      </>
                    )}
                  </div>
                  {item.flagReason && (
                    <div className="mt-2 text-sm text-error bg-error/10 rounded-lg px-3 py-1.5">
                      <strong>Flag reason:</strong> {item.flagReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.moderation !== "APPROVED" && (
                    <button
                      className="btn btn-success btn-sm gap-1"
                      onClick={() => handleModeration(item.id, item.contentType, "APPROVED")}
                      disabled={updating === item.id}
                    >
                      {updating === item.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      <span>Approve</span>
                    </button>
                  )}
                  {item.moderation !== "REJECTED" && (
                    <button
                      className="btn btn-error btn-outline btn-sm gap-1"
                      onClick={() => handleModeration(item.id, item.contentType, "REJECTED")}
                      disabled={updating === item.id}
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Reject
                    </button>
                  )}
                  {item.moderation !== "FLAGGED" && (
                    <button
                      className="btn btn-warning btn-outline btn-sm gap-1"
                      onClick={() => setFlagModal({ id: item.id, type: item.contentType })}
                      disabled={updating === item.id}
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
                          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                        />
                      </svg>
                      Flag
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allContent.length === 0 && (
        <div className="text-center py-16 text-base-content/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 opacity-30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg">No content found matching your filters.</p>
        </div>
      )}

      {/* Flag Modal */}
      {flagModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Flag Content</h3>
            <p className="py-2 text-base-content/70">
              Provide a reason for flagging this content. Flagged content will be unpublished.
            </p>
            <div className="form-control">
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Reason for flagging..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setFlagModal(null);
                  setFlagReason("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={() =>
                  handleModeration(flagModal.id, flagModal.type, "FLAGGED", flagReason)
                }
                disabled={!flagReason.trim()}
              >
                Flag Content
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setFlagModal(null);
              setFlagReason("");
            }}
          />
        </div>
      )}
    </div>
  );
}
