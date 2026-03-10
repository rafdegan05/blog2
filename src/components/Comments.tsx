"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactionBar from "@/components/ReactionBar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useTranslation } from "@/components/LanguageProvider";

/* ── Types ── */

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
  replies?: CommentData[];
}

interface CommentsProps {
  postId: string;
  initialComments: CommentData[];
}

/* ── Helpers ── */

function useRelativeTime() {
  const { t } = useTranslation();

  return (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return t.comments.justNow;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return t.comments.minutesAgo.replace("{n}", String(mins));
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t.comments.hoursAgo.replace("{n}", String(hrs));
    const days = Math.floor(hrs / 24);
    if (days < 30) return t.comments.daysAgo.replace("{n}", String(days));
    return new Date(iso).toLocaleDateString();
  };
}

function countAll(comments: CommentData[]): number {
  return comments.reduce((sum, c) => sum + 1 + (c.replies ? countAll(c.replies) : 0), 0);
}

/* ── Avatar ── */

function Avatar({
  name,
  image,
  size = 32,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
}) {
  const cls = size <= 32 ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`comment-avatar ${cls}`}>
      {image ? (
        <Image
          src={image}
          alt=""
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      ) : (
        <span>{name?.charAt(0)?.toUpperCase() || "U"}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   CommentItem
   ═══════════════════════════════════════ */

function CommentItem({
  comment,
  postId,
  depth,
  onReplyAdded,
  onDeleted,
  onEdited,
}: {
  comment: CommentData;
  postId: string;
  depth: number;
  onReplyAdded: () => void;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();

  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isOwner = session?.user?.id === comment.author.id;
  const hasReplies = comment.replies && comment.replies.length > 0;

  /* ── Reply ── */
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, postId, parentId: comment.id }),
      });
      setReplyContent("");
      setShowReply(false);
      onReplyAdded();
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Edit ── */
  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      setEditing(false);
      onEdited();
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    setShowDeleteConfirm(false);
    onDeleted();
  };

  return (
    <div
      className={`comment-item ${depth > 0 ? "comment-item--nested" : ""}`}
      style={{ "--comment-depth": depth } as React.CSSProperties}
    >
      {/* Header */}
      <div className="comment-header">
        <Avatar name={comment.author.name} image={comment.author.image} />
        <div className="flex flex-col min-w-0">
          <span className="comment-author">{comment.author.name || t.common.anonymous}</span>
          <span className="comment-time">{relativeTime(comment.createdAt)}</span>
        </div>

        {/* Collapse toggle for threads */}
        {hasReplies && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="comment-collapse-btn ml-auto"
            aria-label={collapsed ? t.comments.expand : t.comments.collapse}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      {editing ? (
        <div className="comment-edit-area">
          <MarkdownEditor
            value={editContent}
            onChange={setEditContent}
            placeholder={t.comments.writeComment}
            rows={3}
            compact
          />
          <div className="flex gap-2 justify-end mt-2">
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setEditing(false);
                setEditContent(comment.content);
              }}
            >
              {t.common.cancel}
            </button>
            <button className="btn btn-primary btn-xs" onClick={handleEdit} disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : t.common.save}
            </button>
          </div>
        </div>
      ) : (
        <div className="comment-body">
          <MarkdownRenderer content={comment.content} />
        </div>
      )}

      {/* Actions */}
      <div className="comment-actions">
        <ReactionBar commentId={comment.id} compact />

        <div className="comment-action-btns">
          {session && (
            <button
              className="comment-action-btn"
              onClick={() => {
                setShowReply(!showReply);
                setShowDeleteConfirm(false);
              }}
            >
              <ReplyIcon />
              {t.comments.reply}
            </button>
          )}
          {isOwner && (
            <>
              <button
                className="comment-action-btn"
                onClick={() => {
                  setEditing(true);
                  setShowDeleteConfirm(false);
                }}
              >
                <EditIcon />
                {t.common.edit}
              </button>
              <button
                className="comment-action-btn comment-action-btn--danger"
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              >
                <TrashIcon />
                {t.common.delete}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline delete confirmation */}
      {showDeleteConfirm && (
        <div className="comment-delete-confirm">
          <span className="text-sm">{t.comments.deleteConfirm}</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-xs" onClick={() => setShowDeleteConfirm(false)}>
              {t.common.cancel}
            </button>
            <button className="btn btn-error btn-xs" onClick={handleDelete}>
              {t.common.delete}
            </button>
          </div>
        </div>
      )}

      {/* Reply form */}
      {showReply && (
        <div className="comment-reply-form">
          <Avatar name={session?.user?.name} image={session?.user?.image} size={28} />
          <div className="flex-1">
            <MarkdownEditor
              value={replyContent}
              onChange={setReplyContent}
              placeholder={t.comments.writeReply}
              rows={2}
              compact
            />
            <div className="flex gap-2 justify-end mt-2">
              <button className="btn btn-ghost btn-xs" onClick={() => setShowReply(false)}>
                {t.common.cancel}
              </button>
              <button
                className="btn btn-primary btn-xs"
                onClick={handleReply}
                disabled={submitting}
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  t.comments.send
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && !collapsed && (
        <div className="comment-replies">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
              onDeleted={onDeleted}
              onEdited={onEdited}
            />
          ))}
        </div>
      )}

      {/* Collapsed count */}
      {hasReplies && collapsed && (
        <button className="comment-collapsed-label" onClick={() => setCollapsed(false)}>
          {t.comments.collapsedReplies.replace("{n}", String(comment.replies!.length))}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Comments (root)
   ═══════════════════════════════════════ */

export default function Comments({ postId, initialComments }: CommentsProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = countAll(comments);

  const refreshComments = useCallback(async () => {
    const res = await fetch(`/api/comments?postId=${postId}`);
    const data = await res.json();
    setComments(data);
  }, [postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, postId }),
      });
      setNewComment("");
      await refreshComments();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comments-section">
      {/* Section header */}
      <div className="comments-section-header">
        <div className="flex items-center gap-2">
          <ChatBubbleIcon />
          <h3 className="text-xl font-bold">{t.comments.title.replace("{n}", String(total))}</h3>
        </div>
      </div>

      {/* New comment form */}
      {session ? (
        <div className="comment-compose">
          <Avatar name={session.user?.name} image={session.user?.image} size={40} />
          <div className="flex-1">
            <MarkdownEditor
              value={newComment}
              onChange={setNewComment}
              placeholder={t.comments.writeComment}
              rows={3}
              compact
            />
            <div className="flex justify-end mt-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <>
                    <SendIcon />
                    {t.comments.comment}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="comment-signin-prompt">
          <ChatBubbleIcon />
          <p>
            <Link href="/auth/signin" className="link link-primary font-medium">
              {t.common.signIn}
            </Link>
            {t.comments.signInPrompt}
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comment-empty">
            <div className="comment-empty-icon">
              <ChatBubbleIcon large />
            </div>
            <p className="font-medium">{t.comments.noComments}</p>
            <p className="text-sm text-base-content/40">{t.comments.beFirst}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              depth={0}
              onReplyAdded={refreshComments}
              onDeleted={refreshComments}
              onEdited={refreshComments}
            />
          ))
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   Icons
   ══════════════════════════════════════ */

function ChatBubbleIcon({ large }: { large?: boolean } = {}) {
  const cls = large ? "w-10 h-10" : "w-5 h-5";
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function ReplyIcon() {
  return (
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
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

function EditIcon() {
  return (
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}
