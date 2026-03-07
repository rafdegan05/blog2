"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";

interface PostData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  categories: { name: string }[];
  tags: { name: string }[];
  authorId: string;
}

export default function EditPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`);
        if (!res.ok) {
          setError("Post not found");
          setLoading(false);
          return;
        }
        const post: PostData = await res.json();

        // Check ownership
        if (post.authorId !== session.user?.id && session.user?.role !== "ADMIN") {
          setError("You don't have permission to edit this post");
          setLoading(false);
          return;
        }

        setTitle(post.title);
        setContent(post.content);
        setExcerpt(post.excerpt || "");
        setCoverImage(post.coverImage || "");
        setPublished(post.published);
        setCategories(post.categories.map((c) => c.name).join(", "));
        setTags(post.tags.map((t) => t.name).join(", "));
      } catch {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Sign in required</h1>
        <p className="mb-4">You need to sign in to edit a post.</p>
        <Link href="/auth/signin" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
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
        <Link href="/dashboard" className="btn btn-ghost">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || undefined,
          coverImage: coverImage || undefined,
          published,
          categories: categories
            ? categories
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : undefined,
          tags: tags
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update post");
        return;
      }

      const updated = await res.json();
      setSuccess("Post updated successfully!");
      setTimeout(() => {
        router.push(`/blog/${updated.slug}`);
      }, 1000);
    } catch {
      setError("An error occurred while updating the post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete post");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("An error occurred while deleting the post");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/blog/${slug}`} className="btn btn-ghost btn-sm">
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
            Back
          </Link>
          <h1 className="text-3xl font-bold">Edit Post</h1>
        </div>
        <button onClick={handleDelete} className="btn btn-error btn-outline btn-sm gap-1">
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
      </div>

      <div role="tablist" className="tabs tabs-boxed mb-6">
        <button
          role="tab"
          className={`tab ${!preview ? "tab-active" : ""}`}
          onClick={() => setPreview(false)}
        >
          Editor
        </button>
        <button
          role="tab"
          className={`tab ${preview ? "tab-active" : ""}`}
          onClick={() => setPreview(true)}
        >
          Preview
        </button>
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

      {preview ? (
        <div className="card bg-base-200 p-6">
          <h1 className="text-4xl font-bold mb-4">{title || "Untitled"}</h1>
          {excerpt && <p className="text-base-content/60 mb-4 italic">{excerpt}</p>}
          <MarkdownRenderer content={content || "*No content yet...*"} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
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

          <div className="form-control">
            <label className="label" htmlFor="edit-post-title">
              <span className="label-text font-semibold">Title *</span>
            </label>
            <input
              id="edit-post-title"
              type="text"
              className="input input-bordered w-full"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="edit-post-excerpt">
              <span className="label-text font-semibold">Excerpt</span>
            </label>
            <textarea
              id="edit-post-excerpt"
              className="textarea textarea-bordered w-full"
              placeholder="Brief description of the post"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="edit-post-content">
              <span className="label-text font-semibold">Content * (Markdown supported)</span>
            </label>
            <textarea
              id="edit-post-content"
              className="textarea textarea-bordered w-full font-mono"
              placeholder="Write your post content in Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              required
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="edit-post-cover">
              <span className="label-text font-semibold">Cover Image URL</span>
            </label>
            <input
              id="edit-post-cover"
              type="url"
              className="input input-bordered w-full"
              placeholder="https://example.com/image.jpg"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
            {coverImage && (
              <div className="mt-2">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="max-h-48 rounded-lg object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="edit-post-categories">
                <span className="label-text font-semibold">Categories (comma-separated)</span>
              </label>
              <input
                id="edit-post-categories"
                type="text"
                className="input input-bordered w-full"
                placeholder="Tech, Programming"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="edit-post-tags">
                <span className="label-text font-semibold">Tags (comma-separated)</span>
              </label>
              <input
                id="edit-post-tags"
                type="text"
                className="input input-bordered w-full"
                placeholder="nextjs, react, typescript"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span className="label-text font-semibold">Published</span>
            </label>
          </div>

          <div className="divider" />

          <div className="flex gap-4 justify-between">
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary gap-2" disabled={submitting}>
                {submitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
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
                    Save Changes
                  </>
                )}
              </button>
              <Link href={`/blog/${slug}`} className="btn btn-ghost">
                Cancel
              </Link>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
