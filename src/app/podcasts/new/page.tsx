"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function NewPodcastPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
        <h1 className="text-3xl font-bold mb-4">{t.auth.signInRequired}</h1>
        <p className="mb-4">{t.podcasts.signInToCreate}</p>
        <Link href="/auth/signin" className="btn btn-primary">
          {t.common.signIn}
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
        setError(data.error || t.podcasts.createPodcastFailed);
        return;
      }

      const podcast = await res.json();
      router.push(`/podcasts/${podcast.slug}`);
    } catch {
      setError(t.podcasts.createPodcastError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t.podcasts.createPodcast}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t.podcasts.podcastTitleLabel}</span>
          </label>
          <input
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
          <label className="label">
            <span className="label-text">{t.podcasts.descriptionLabel}</span>
          </label>
          <textarea
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
            <label className="label">
              <span className="label-text">{t.podcasts.durationLabel}</span>
            </label>
            <input
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
            <label className="label">
              <span className="label-text">{t.podcasts.categoriesLabel}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={t.podcasts.categoriesPlaceholder}
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t.podcasts.tagsLabel}</span>
            </label>
            <input
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
            <span className="label-text">{t.podcasts.publishImmediately}</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              t.podcasts.createPodcastBtn
            )}
          </button>
          <Link href="/podcasts" className="btn btn-ghost">
            {t.common.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}
