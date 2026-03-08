"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

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
  const { t } = useTranslation();

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
          setError(t.podcasts.podcastNotFoundError);
          setLoading(false);
          return;
        }
        const podcast: PodcastData = await res.json();

        if (podcast.authorId !== session.user?.id && session.user?.role !== "ADMIN") {
          setError(t.podcasts.noPermissionEdit);
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
        setError(t.podcasts.loadFailed);
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
        <h1 className="text-3xl font-bold mb-4">{t.auth.signInRequired}</h1>
        <p className="mb-4">{t.podcasts.signInToEdit}</p>
        <Link href="/auth/signin" className="btn btn-primary">
          {t.common.signIn}
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
          {t.podcasts.backToDashboard}
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
        setError(data.error || t.podcasts.updateFailed);
        return;
      }

      const updated = await res.json();
      setSuccess(t.podcasts.updateSuccess);
      setTimeout(() => {
        router.push(`/podcasts/${updated.slug}`);
      }, 1000);
    } catch {
      setError(t.podcasts.updateError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.podcasts.deleteConfirm)) {
      return;
    }

    try {
      const res = await fetch(`/api/podcasts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.podcasts.deleteFailed);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError(t.podcasts.deleteError);
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
          <h1 className="text-3xl font-bold">{t.podcasts.editPodcast}</h1>
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
            <span className="label-text font-semibold">{t.podcasts.podcastTitleLabel}</span>
          </label>
          <input
            id="edit-podcast-title"
            type="text"
            className="input input-bordered w-full"
            placeholder={t.podcasts.podcastTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <FileUpload
          type="audio"
          label={t.podcasts.audioFileLabel}
          value={audioUrl}
          onUpload={setAudioUrl}
          disabled={submitting}
        />

        <div className="form-control">
          <label className="label" htmlFor="edit-podcast-desc">
            <span className="label-text font-semibold">{t.podcasts.descriptionLabel}</span>
          </label>
          <textarea
            id="edit-podcast-desc"
            className="textarea textarea-bordered w-full"
            placeholder={t.podcasts.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload
            type="image"
            label={t.podcasts.coverImage}
            value={coverImage}
            onUpload={setCoverImage}
            disabled={submitting}
          />
          <div className="form-control">
            <label className="label" htmlFor="edit-podcast-duration">
              <span className="label-text font-semibold">{t.podcasts.durationLabel}</span>
            </label>
            <input
              id="edit-podcast-duration"
              type="number"
              className="input input-bordered w-full"
              placeholder={t.podcasts.durationPlaceholder}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label" htmlFor="edit-podcast-categories">
              <span className="label-text font-semibold">{t.podcasts.categoriesLabel}</span>
            </label>
            <input
              id="edit-podcast-categories"
              type="text"
              className="input input-bordered w-full"
              placeholder={t.podcasts.categoriesPlaceholder}
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="edit-podcast-tags">
              <span className="label-text font-semibold">{t.podcasts.tagsLabel}</span>
            </label>
            <input
              id="edit-podcast-tags"
              type="text"
              className="input input-bordered w-full"
              placeholder={t.podcasts.tagsPlaceholder}
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
            <span className="label-text font-semibold">{t.podcasts.publishedCheckbox}</span>
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
            {t.common.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}
