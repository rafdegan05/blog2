"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

interface PodcastData {
  title: string;
  description?: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  transcript?: string | null;
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
  const [transcript, setTranscript] = useState("");
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [generatingTranscript, setGeneratingTranscript] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportTranscript = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleGenerateTranscript = useCallback(async () => {
    if (!audioUrl) {
      setError(t.podcasts.generateTranscriptError);
      return;
    }
    setGeneratingTranscript(true);
    setError("");
    try {
      const res = await fetch("/api/podcasts/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.podcasts.generateTranscriptError);
        return;
      }
      const data = await res.json();
      setTranscript(data.transcript);
    } catch {
      setError(t.podcasts.generateTranscriptError);
    } finally {
      setGeneratingTranscript(false);
    }
  }, [audioUrl, t]);

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
        setTranscript(podcast.transcript || "");
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
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
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
          transcript: transcript || null,
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
    try {
      const res = await fetch(`/api/podcasts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.podcasts.deleteFailed);
        setShowDeleteConfirm(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError(t.podcasts.deleteError);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="podcast-form-page">
      {/* ── Hero header ── */}
      <div className="podcast-form-hero">
        <div className="max-w-3xl mx-auto px-4">
          <Link href={`/podcasts/${slug}`} className="podcast-form-back">
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
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
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
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {t.podcasts.editPodcast}
                </h1>
                <p className="text-sm text-base-content/50 mt-0.5">{t.podcasts.editSubtitle}</p>
              </div>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-ghost btn-sm text-error gap-1.5"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="hidden sm:inline">{t.podcasts.deleteBtn}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-error font-medium">
                  {t.podcasts.deleteConfirmShort}
                </span>
                <button onClick={handleDelete} className="btn btn-error btn-sm">
                  {t.podcasts.confirmYes}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-ghost btn-sm"
                >
                  {t.common.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Alerts */}
        {success && (
          <div className="alert alert-success mb-6">
            <svg className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="alert alert-error">
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
                <label className="label py-1" htmlFor="edit-podcast-title">
                  <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                    {t.podcasts.podcastTitleLabel}
                  </span>
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
              <div className="form-control">
                <label className="label py-1" htmlFor="edit-podcast-desc">
                  <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                    {t.podcasts.descriptionLabel}
                  </span>
                </label>
                <textarea
                  id="edit-podcast-desc"
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
                  <label className="label py-1" htmlFor="edit-podcast-duration">
                    <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                      {t.podcasts.durationLabel}
                    </span>
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
                  <label className="label py-1" htmlFor="edit-podcast-categories">
                    <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                      {t.podcasts.categoriesLabel}
                    </span>
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
                  <label className="label py-1" htmlFor="edit-podcast-tags">
                    <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                      {t.podcasts.tagsLabel}
                    </span>
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
              <div className="flex items-center gap-2 mb-3 flex-wrap">
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
                <button
                  type="button"
                  onClick={handleGenerateTranscript}
                  className="btn btn-secondary btn-sm gap-1.5"
                  disabled={generatingTranscript || !audioUrl}
                >
                  {generatingTranscript ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
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
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                      />
                    </svg>
                  )}
                  {generatingTranscript
                    ? t.podcasts.generatingTranscript
                    : t.podcasts.generateTranscript}
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
                  <span className="font-medium text-sm">{t.podcasts.publishedCheckbox}</span>
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
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t.podcasts.saveChanges}
                </>
              )}
            </button>
            <Link href={`/podcasts/${slug}`} className="btn btn-ghost">
              {t.common.cancel}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
