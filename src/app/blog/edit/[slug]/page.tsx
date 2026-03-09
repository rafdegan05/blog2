"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MediumEditor from "@/components/MediumEditor";
import MarkdownEditor from "@/components/MarkdownEditor";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

type EditorMode = "medium" | "markdown";

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
  const { t } = useTranslation();
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
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("medium");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const hasUnsavedChanges = useRef(false);
  const initialLoadDone = useRef(false);

  // Track unsaved changes (only after initial load)
  useEffect(() => {
    if (initialLoadDone.current) {
      hasUnsavedChanges.current = true;
    }
  }, [title, content, excerpt, coverImage, categories, tags, published]);

  // Warn on leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Auto-resize title textarea
  const resizeTitle = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  useEffect(() => {
    resizeTitle();
  }, [title, resizeTitle]);

  // Word count & reading time
  const stats = useMemo(() => {
    const text = content.replace(/[#*_~`>\[\]()!-]/g, " ");
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, readingTime };
  }, [content]);

  // Image upload handler for inline images
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "image");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  }, []);

  // Fetch post data
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`);
        if (!res.ok) {
          setError(t.blog.postNotFoundError);
          setLoading(false);
          return;
        }
        const post: PostData = await res.json();

        // Check ownership
        if (post.authorId !== session.user?.id && session.user?.role !== "ADMIN") {
          setError(t.blog.noPermissionEdit);
          setLoading(false);
          return;
        }

        setTitle(post.title);
        setContent(post.content);
        setExcerpt(post.excerpt || "");
        setCoverImage(post.coverImage || "");
        setPublished(post.published);
        setCategories(post.categories.map((c) => c.name).join(", "));
        setTags(post.tags.map((tg) => tg.name).join(", "));

        // Mark initial load done after a tick, so the first round of
        // setState calls won't flag as unsaved
        setTimeout(() => {
          initialLoadDone.current = true;
        }, 100);
      } catch {
        setError(t.blog.loadFailed);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, session, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (submitting || !title.trim() || !content.trim()) return;
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
                  .map((tg) => tg.trim())
                  .filter(Boolean)
              : undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || t.blog.updateFailed);
          return;
        }

        hasUnsavedChanges.current = false;
        const updated = await res.json();
        setSuccess(t.blog.updateSuccess);
        setTimeout(() => {
          router.push(`/blog/${updated.slug}`);
        }, 1000);
      } catch {
        setError(t.blog.updateError);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, title, content, excerpt, coverImage, published, categories, tags, slug, router, t]
  );

  // Keyboard shortcut: Ctrl/Cmd + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.blog.deleteFailed);
        return;
      }
      hasUnsavedChanges.current = false;
      router.push("/dashboard");
    } catch {
      setError(t.blog.deleteError);
    }
  }, [slug, router, t]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">{t.auth.signInRequired}</h1>
        <p className="mb-6 opacity-60">{t.blog.signInToEdit}</p>
        <Link href="/auth/signin" className="btn btn-primary">
          {t.common.signIn}
        </Link>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
        <Link href="/dashboard" className="btn btn-ghost">
          {t.blog.backToDashboard}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-base-100/80 backdrop-blur-md border-b border-base-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/blog/${slug}`}
            className="btn btn-ghost btn-sm gap-1 opacity-60 hover:opacity-100"
          >
            <ArrowLeftIcon />
            <span className="hidden sm:inline">{t.common.back}</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Word count / Reading time */}
            {stats.words > 0 && (
              <span className="text-xs text-base-content/40 hidden sm:inline">
                {t.blog.wordCount.replace("{n}", String(stats.words))} ·{" "}
                {t.common.minRead.replace("{n}", String(stats.readingTime))}
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-ghost btn-sm text-error opacity-60 hover:opacity-100"
              title={t.common.delete}
            >
              <TrashIcon />
            </button>

            {/* Editor mode toggle */}
            <div className="join join-horizontal">
              <button
                type="button"
                onClick={() => setEditorMode("medium")}
                className={`join-item btn btn-ghost btn-xs ${
                  editorMode === "medium" ? "btn-active" : "opacity-50"
                }`}
                title={t.blog.editorMedium}
              >
                <WysiwygIcon />
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("markdown")}
                className={`join-item btn btn-ghost btn-xs ${
                  editorMode === "markdown" ? "btn-active" : "opacity-50"
                }`}
                title={t.blog.editorMarkdown}
              >
                <MarkdownMdIcon />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`btn btn-ghost btn-sm gap-1 ${showSettings ? "btn-active" : ""}`}
            >
              <SettingsIcon />
              <span className="hidden sm:inline">{t.mediumEditor.publishSettings}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting || !title.trim() || !content.trim()}
              className="btn btn-primary btn-sm"
            >
              {submitting ? <span className="loading loading-spinner loading-xs" /> : t.common.save}
            </button>
          </div>
        </div>
      </div>

      {/* ── Success toast ── */}
      {success && (
        <div className="border-b border-success/30 bg-success/10 transition-all duration-300">
          <div className="max-w-3xl mx-auto px-4 py-2 text-sm text-success text-center flex items-center justify-center gap-2">
            <CheckIcon />
            {success}
          </div>
        </div>
      )}

      {/* ── Settings panel (collapsible, animated) ── */}
      <div
        className={`border-b border-base-200 bg-base-100 overflow-hidden transition-all duration-300 ease-in-out ${
          showSettings ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          {error && (
            <div className="alert alert-error mb-4 text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                  {t.blog.excerptLabel}
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full"
                placeholder={t.blog.excerptPlaceholder}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <FileUpload
                type="image"
                label={t.blog.coverImage}
                value={coverImage}
                onUpload={setCoverImage}
                disabled={submitting}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                  {t.blog.categoriesLabel}
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder={t.blog.categoriesPlaceholder}
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium uppercase tracking-wide opacity-60">
                  {t.blog.tagsLabel}
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder={t.blog.tagsPlaceholder}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <label className="label cursor-pointer justify-start gap-3 py-1">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span className="label-text text-sm">
                {published ? t.common.published : t.common.draft}
              </span>
            </label>

            <span className="text-xs text-base-content/30">Ctrl+S {t.blog.toSave}</span>
          </div>
        </div>
      </div>

      {/* ── Main editor area ── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {error && !showSettings && (
          <div className="alert alert-error mb-6 text-sm">
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <textarea
          ref={titleRef}
          className="medium-title-input"
          placeholder={t.mediumEditor.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const editorEl = document.querySelector(".medium-editor-content .tiptap");
              if (editorEl instanceof HTMLElement) editorEl.focus();
            }
          }}
        />

        {/* Subtitle / Excerpt (inline) */}
        <textarea
          className="medium-subtitle-input mt-2 mb-8"
          placeholder={t.mediumEditor.subtitlePlaceholder}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={1}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }}
        />

        {/* Content editor */}
        {editorMode === "medium" ? (
          <MediumEditor
            value={content}
            onChange={setContent}
            placeholder={t.mediumEditor.placeholder}
            onImageUpload={handleImageUpload}
          />
        ) : (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder={t.blog.contentPlaceholder}
            rows={20}
          />
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-base-100 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-bold text-lg mb-2">{t.blog.deleteTitle}</h3>
            <p className="text-sm text-base-content/60 mb-6">{t.blog.deleteConfirm}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  handleDelete();
                }}
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Icons ── */

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function WysiwygIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  );
}

function MarkdownMdIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l-4 4 4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4l-4 16" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.11 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
