"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";
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
  const [transcript, setTranscript] = useState("");
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportTranscript = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleTranscriptFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setTranscript(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

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
          transcript: transcript || undefined,
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
    <div className="podcast-form-page">
      {/* ── Hero header ── */}
      <div className="podcast-form-hero">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/podcasts" className="podcast-form-back">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.back}
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="podcast-form-icon">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {t.podcasts.createPodcast}
              </h1>
              <p className="text-sm text-base-content/50 mt-0.5">{t.podcasts.formSubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="alert alert-error mb-6">
            <svg className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Section 1: Episode Details ── */}
          <div className="podcast-form-section">
            <div className="podcast-form-section-header">
              <div className="podcast-form-section-icon">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </div>
              <h2 className="podcast-form-section-title">{t.podcasts.sectionDetails}</h2>
            </div>
            <div className="podcast-form-section-body space-y-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                    {t.podcasts.podcastTitleLabel}
                  </span>
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
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                    {t.podcasts.descriptionLabel}
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder={t.podcasts.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Media ── */}
          <div className="podcast-form-section">
            <div className="podcast-form-section-header">
              <div className="podcast-form-section-icon">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                  />
                </svg>
              </div>
              <h2 className="podcast-form-section-title">{t.podcasts.sectionMedia}</h2>
            </div>
            <div className="podcast-form-section-body space-y-4">
              <FileUpload
                type="audio"
                label={t.podcasts.audioFileLabel}
                value={audioUrl}
                onUpload={setAudioUrl}
                disabled={submitting}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUpload
                  type="image"
                  label={t.podcasts.coverImage}
                  value={coverImage}
                  onUpload={setCoverImage}
                  disabled={submitting}
                />
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                      {t.podcasts.durationLabel}
                    </span>
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
            </div>
          </div>

          {/* ── Section 3: Metadata ── */}
          <div className="podcast-form-section">
            <div className="podcast-form-section-header">
              <div className="podcast-form-section-icon">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <h2 className="podcast-form-section-title">{t.podcasts.sectionMetadata}</h2>
            </div>
            <div className="podcast-form-section-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                      {t.podcasts.categoriesLabel}
                    </span>
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
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                      {t.podcasts.tagsLabel}
                    </span>
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
            </div>
          </div>

          {/* ── Section 4: Transcript ── */}
          <div className="podcast-form-section">
            <div className="podcast-form-section-header">
              <div className="podcast-form-section-icon">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <h2 className="podcast-form-section-title">{t.podcasts.transcriptLabel}</h2>
              <span className="podcast-form-badge">{t.podcasts.optionalBadge}</span>
            </div>
            <div className="podcast-form-section-body">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleImportTranscript}
                  className="btn btn-outline btn-sm gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  {t.podcasts.importTranscript}
                </button>
                {transcript && (
                  <button
                    type="button"
                    onClick={() => setTranscript("")}
                    className="btn btn-ghost btn-sm text-error gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t.podcasts.clearTranscript}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.srt,.vtt,.md"
                  className="hidden"
                  onChange={handleTranscriptFile}
                />
                {transcript && (
                  <span className="ml-auto text-xs text-base-content/40">
                    {transcript.length.toLocaleString()} {t.podcasts.characters}
                  </span>
                )}
              </div>
              <textarea
                className="textarea textarea-bordered w-full font-mono text-sm leading-relaxed"
                placeholder={t.podcasts.transcriptPlaceholder}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-base-content/40 mt-1.5">{t.podcasts.transcriptHint}</p>
            </div>
          </div>

          {/* ── Section 5: Publishing ── */}
          <div className="podcast-form-section podcast-form-section-publish">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="podcast-form-section-icon">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">{t.podcasts.publishImmediately}</span>
                  <p className="text-xs text-base-content/40">{t.podcasts.publishHint}</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="podcast-form-actions">
            <button type="submit" className="btn btn-primary gap-2" disabled={submitting}>
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t.podcasts.createPodcastBtn}
                </>
              )}
            </button>
            <Link href="/podcasts" className="btn btn-ghost">
              {t.common.cancel}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
