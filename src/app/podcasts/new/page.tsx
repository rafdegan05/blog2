"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";

export default function NewPodcastPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [duration, setDuration] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        <h1 className="text-3xl font-bold mb-4">Sign in required</h1>
        <p className="mb-4">You need to sign in to create a podcast.</p>
        <Link href="/auth/signin" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/podcasts", {
        method: "POST",
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
        setError(data.error || "Failed to create podcast");
        return;
      }

      const podcast = await res.json();
      router.push(`/podcasts/${podcast.slug}`);
    } catch {
      setError("An error occurred while creating the podcast");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Podcast Episode</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text">Title *</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Podcast episode title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <FileUpload
          type="audio"
          label="Audio File *"
          value={audioUrl}
          onUpload={setAudioUrl}
          disabled={submitting}
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Episode description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload
            type="image"
            label="Cover Image"
            value={coverImage}
            onUpload={setCoverImage}
            disabled={submitting}
          />
          <div className="form-control">
            <label className="label">
              <span className="label-text">Duration (seconds)</span>
            </label>
            <input
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
            <label className="label">
              <span className="label-text">Categories (comma-separated)</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Tech, Interviews"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tags (comma-separated)</span>
            </label>
            <input
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
            <span className="label-text">Publish immediately</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Create Podcast"
            )}
          </button>
          <Link href="/podcasts" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
