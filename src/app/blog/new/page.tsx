"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import MediumEditor from "@/components/MediumEditor";
import MarkdownEditor from "@/components/MarkdownEditor";
import FileUpload from "@/components/FileUpload";
import Image from "next/image";
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
  const coverInputRef = useRef<HTMLInputElement>(null);
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

  // Cover image upload handler
  const handleCoverUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const url = await handleImageUpload(file);
        setCoverImage(url);
      } catch {
        setError(t.blog.createPostError);
      }
      e.target.value = "";
    },
    [handleImageUpload, t]
  );

  // Category & tag pill helpers
  const categoryList = useMemo(
    () =>
      categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    [categories]
  );

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((tg) => tg.trim())
        .filter(Boolean),
    [tags]
  );

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || categoryList.includes(trimmed)) return;
      setCategories((prev) => (prev ? `${prev}, ${trimmed}` : trimmed));
    },
    [categoryList]
  );

  const removeCategory = useCallback((name: string) => {
    setCategories((prev) =>
      prev
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c && c !== name)
        .join(", ")
    );
  }, []);

  const addTag = useCallback(
    (name: string) => {
      const trimmed = name.trim().replace(/^#/, "");
      if (!trimmed || tagList.includes(trimmed)) return;
      setTags((prev) => (prev ? `${prev}, ${trimmed}` : trimmed));
    },
    [tagList]
  );

  const removeTag = useCallback((name: string) => {
    setTags((prev) =>
      prev
        .split(",")
        .map((tg) => tg.trim())
        .filter((tg) => tg && tg !== name)
        .join(", ")
    );
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

        {/* Cover image */}
        <div className="mb-6">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
          {coverImage ? (
            <div className="medium-cover-preview group">
              <Image
                src={coverImage}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 48rem"
                className="object-cover"
              />
              <div className="medium-cover-overlay">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="btn btn-sm btn-ghost text-white"
                >
                  {t.mediumEditor.changeCoverImage}
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="btn btn-sm btn-ghost text-white"
                >
                  {t.mediumEditor.removeCoverImage}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="medium-cover-empty"
            >
              <CoverImageIcon />
              <span>{t.mediumEditor.addCoverImage}</span>
            </button>
          )}
        </div>

        {/* Title */}
        <div className="medium-field-wrapper">
          <label className="medium-field-label">{t.mediumEditor.titleLabel}</label>
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
        </div>

        {/* Subtitle / Excerpt (inline) */}
        <div className="medium-field-wrapper mt-2">
          <label className="medium-field-label">{t.mediumEditor.subtitleLabel}</label>
          <textarea
            className="medium-subtitle-input"
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
        </div>

        {/* Categories & Tags (inline pills) */}
        <div className="medium-meta-area mt-4 mb-8">
          <div className="medium-pills-row">
            {categoryList.map((cat) => (
              <span key={cat} className="badge badge-primary badge-sm gap-0.5 font-medium">
                {cat}
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  className="medium-pill-remove"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              className="medium-pill-input"
              placeholder={t.mediumEditor.addCategory}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addCategory(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
                if (e.key === "Backspace" && !e.currentTarget.value && categoryList.length > 0) {
                  removeCategory(categoryList[categoryList.length - 1]);
                }
              }}
            />
          </div>
          <div className="medium-pills-row">
            {tagList.map((tag) => (
              <span key={tag} className="badge badge-outline badge-sm gap-0.5">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="medium-pill-remove">
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              className="medium-pill-input"
              placeholder={t.mediumEditor.addTag}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
                if (e.key === "Backspace" && !e.currentTarget.value && tagList.length > 0) {
                  removeTag(tagList[tagList.length - 1]);
                }
              }}
            />
          </div>
        </div>

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

function CoverImageIcon() {
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM8.25 8.25h.008v.008H8.25V8.25z"
      />
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
