"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import MediumEditor from "@/components/MediumEditor";
import MarkdownEditor from "@/components/MarkdownEditor";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

type EditorMode = "medium" | "markdown";

export default function NewPostPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("medium");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const hasUnsavedChanges = useRef(false);

  // Track unsaved changes
  useEffect(() => {
    hasUnsavedChanges.current = !!(title.trim() || content.trim());
  }, [title, content, excerpt, categories, tags]);

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

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (submitting || !title.trim() || !content.trim()) return;
      setSubmitting(true);
      setError("");

      try {
        const res = await fetch("/api/posts", {
          method: "POST",
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
          setError(data.error || t.blog.createPostFailed);
          return;
        }

        hasUnsavedChanges.current = false;
        const post = await res.json();
        router.push(`/blog/${post.slug}`);
      } catch {
        setError(t.blog.createPostError);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, title, content, excerpt, coverImage, published, categories, tags, router, t]
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

  if (status === "loading") {
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
        <p className="mb-6 opacity-60">{t.blog.signInToCreate}</p>
        <Link href="/auth/signin" className="btn btn-primary">
          {t.common.signIn}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-base-100/80 backdrop-blur-md border-b border-base-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/blog" className="btn btn-ghost btn-sm gap-1 opacity-60 hover:opacity-100">
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
                <MarkdownIcon />
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
              {submitting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : published ? (
                t.blog.publishBtn
              ) : (
                t.blog.saveDraftBtn
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Settings panel (collapsible) ── */}
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

function MarkdownIcon() {
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
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
