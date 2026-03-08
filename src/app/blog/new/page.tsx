"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarkdownEditor from "@/components/MarkdownEditor";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

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
  const [preview, setPreview] = useState(false);
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
        <p className="mb-4">{t.blog.signInToCreate}</p>
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
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.blog.createPostFailed);
        return;
      }

      const post = await res.json();
      router.push(`/blog/${post.slug}`);
    } catch {
      setError(t.blog.createPostError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t.blog.createPost}</h1>

      <div className="tabs tabs-boxed mb-6">
        <button className={`tab ${!preview ? "tab-active" : ""}`} onClick={() => setPreview(false)}>
          ✏️ {t.blog.editor}
        </button>
        <button className={`tab ${preview ? "tab-active" : ""}`} onClick={() => setPreview(true)}>
          👁️ {t.blog.preview}
        </button>
      </div>

      {preview ? (
        <div className="card bg-base-200 p-6">
          <h1 className="text-4xl font-bold mb-4">{title || t.blog.untitled}</h1>
          {excerpt && <p className="text-base-content/60 mb-4 italic">{excerpt}</p>}
          <MarkdownRenderer content={content || t.blog.noContentYet} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t.blog.titleLabel}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={t.blog.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t.blog.excerptLabel}</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder={t.blog.excerptPlaceholder}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t.blog.contentLabel}</span>
            </label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder={t.blog.contentPlaceholder}
              rows={15}
              required
            />
          </div>

          <FileUpload
            type="image"
            label={t.blog.coverImage}
            value={coverImage}
            onUpload={setCoverImage}
            disabled={submitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.blog.categoriesLabel}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t.blog.categoriesPlaceholder}
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.blog.tagsLabel}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t.blog.tagsPlaceholder}
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
              <span className="label-text">{t.blog.publishImmediately}</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t.blog.createPostBtn
              )}
            </button>
            <Link href="/blog" className="btn btn-ghost">
              {t.common.cancel}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
