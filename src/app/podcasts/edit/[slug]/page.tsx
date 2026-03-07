"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface PodcastData {
  title: string;
  description?: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  published: boolean;
  categories: { name: string }[];
  tags: { name: string }[];
  authorId: string;
}

export default function EditPodcastPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [duration, setDuration] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    const fetchPodcast = async () => {
      try {
        const res = await fetch(`/api/podcasts/${slug}`);
        if (!res.ok) {
          setError("Podcast not found");
          setLoading(false);
          return;
        }
        const podcast: PodcastData = await res.json();

        if (podcast.authorId !== session.user?.id && session.user?.role !== "ADMIN") {
          setError("You don't have permission to edit this podcast");
          setLoading(false);
          return;
        }

        setTitle(podcast.title);
        setDescription(podcast.description || "");
        setAudioUrl(podcast.audioUrl);
        setCoverImage(podcast.coverImage || "");
        setDuration(podcast.duration ? String(podcast.duration) : "");
        setPublished(podcast.published);
        setCategories(podcast.categories.map((c) => c.name).join(", "));
        setTags(podcast.tags.map((t) => t.name).join(", "));
      } catch {
        setError("Failed to load podcast");
      } finally {
        setLoading(false);
      }
    };

    fetchPodcast();
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
        <p className="mb-4">You need to sign in to edit a podcast.</p>
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
      const res = await fetch(`/api/podcasts/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          audioUrl,
          coverImage: coverImage || undefined,
          duration: duration ? parseInt(duration) : undefined,
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
        setError(data.error || "Failed to update podcast");
        return;
      }

      const updated = await res.json();
      setSuccess("Podcast updated successfully!");
      setTimeout(() => {
        router.push(`/podcasts/${updated.slug}`);
      }, 1000);
    } catch {
      setError("An error occurred while updating the podcast");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this podcast? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/podcasts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete podcast");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("An error occurred while deleting the podcast");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/podcasts/${slug}`} className="btn btn-ghost btn-sm">
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
          <h1 className="text-3xl font-bold">Edit Podcast</h1>
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
          <label className="label" htmlFor="edit-podcast-title">
            <span className="label-text font-semibold">Title *</span>
          </label>
          <input
            id="edit-podcast-title"
            type="text"
            className="input input-bordered w-full"
            placeholder="Podcast episode title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="edit-podcast-audio">
            <span className="label-text font-semibold">Audio URL *</span>
          </label>
          <input
            id="edit-podcast-audio"
            type="url"
            className="input input-bordered w-full"
            placeholder="https://example.com/audio.mp3"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            required
          />
          {audioUrl && (
            <div className="mt-2">
              <audio controls className="w-full" src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        <div className="form-control">
          <label className="label" htmlFor="edit-podcast-desc">
            <span className="label-text font-semibold">Description</span>
          </label>
          <textarea
            id="edit-podcast-desc"
            className="textarea textarea-bordered w-full"
            placeholder="Episode description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label" htmlFor="edit-podcast-cover">
              <span className="label-text font-semibold">Cover Image URL</span>
            </label>
            <input
              id="edit-podcast-cover"
              type="url"
              className="input input-bordered w-full"
              placeholder="https://example.com/cover.jpg"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
            {coverImage && (
              <div className="mt-2">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="max-h-32 rounded-lg object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
          </div>
          <div className="form-control">
            <label className="label" htmlFor="edit-podcast-duration">
              <span className="label-text font-semibold">Duration (seconds)</span>
            </label>
            <input
              id="edit-podcast-duration"
              type="number"
              className="input input-bordered w-full"
              placeholder="3600"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label" htmlFor="edit-podcast-categories">
              <span className="label-text font-semibold">Categories (comma-separated)</span>
            </label>
            <input
              id="edit-podcast-categories"
              type="text"
              className="input input-bordered w-full"
              placeholder="Tech, Interviews"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="edit-podcast-tags">
              <span className="label-text font-semibold">Tags (comma-separated)</span>
            </label>
            <input
              id="edit-podcast-tags"
              type="text"
              className="input input-bordered w-full"
              placeholder="javascript, web-dev"
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

        <div className="flex gap-4">
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
          <Link href={`/podcasts/${slug}`} className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
