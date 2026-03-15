"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback, createContext, useContext, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactionBar from "@/components/ReactionBar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useTranslation } from "@/components/LanguageProvider";

/* ══════════════════════════════════════
   Context — collapse / expand all
   ══════════════════════════════════════ */

interface CollapseCtx {
  collapseSignal: number;
  expandSignal: number;
}

const CollapseContext = createContext<CollapseCtx>({
  collapseSignal: 0,
  expandSignal: 0,
});

/* ══════════════════════════════════════
   Types
   ══════════════════════════════════════ */

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name?: string | null;
    image?: string | null;
    role?: "USER" | "AUTHOR" | "ADMIN";
  };
  replies?: CommentData[];
}

interface CommentsProps {
  postId: string;
  initialComments: CommentData[];
}

type SortMode = "newest" | "oldest" | "most-replies";

/* ══════════════════════════════════════
   Helpers
   ══════════════════════════════════════ */

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

/** Recursively filter comments that match a search query */
function filterComments(comments: CommentData[], query: string): CommentData[] {
  if (!query.trim()) return comments;
  const q = query.toLowerCase();
  return comments.reduce<CommentData[]>((acc, c) => {
    const matchesSelf =
      c.content.toLowerCase().includes(q) || (c.author.name?.toLowerCase().includes(q) ?? false);
    const filteredReplies = c.replies ? filterComments(c.replies, query) : [];
    if (matchesSelf || filteredReplies.length > 0) {
      acc.push({
        ...c,
        replies: matchesSelf ? c.replies : filteredReplies,
      });
    }
    return acc;
  }, []);
}

/* ══════════════════════════════════════
   Avatar
   ══════════════════════════════════════ */

function Avatar({
  name,
  image,
  size = 32,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
}) {
  const cls =
    size <= 24
      ? "w-6 h-6 text-[9px]"
      : size <= 28
        ? "w-7 h-7 text-[10px]"
        : size <= 32
          ? "w-8 h-8 text-xs"
          : "w-10 h-10 text-sm";
  return (
    <div className={`rc-avatar ${cls}`}>
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

/* ══════════════════════════════════════
   RoleBadge
   ══════════════════════════════════════ */

function RoleBadge({ role }: { role?: string | null }) {
  const { t } = useTranslation();
  if (!role || role === "USER") return null;
  const label = role === "ADMIN" ? t.comments.roleAdmin : t.comments.roleAuthor;
  const cls = role === "ADMIN" ? "rc-badge rc-badge--admin" : "rc-badge rc-badge--author";
  return <span className={cls}>{label}</span>;
}

/* ══════════════════════════════════════
   CommentItem — threaded, recursive
   ══════════════════════════════════════ */

function CommentItem({
  comment,
  postId,
  depth,
  isLast,
  onReplyAdded,
  onDeleted,
  onEdited,
}: {
  comment: CommentData;
  postId: string;
  depth: number;
  isLast: boolean;
  onReplyAdded: () => void;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();
  const { collapseSignal, expandSignal } = useContext(CollapseContext);

  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* Auto-collapse deep threads (depth >= 4) */
  const [collapsed, setCollapsed] = useState(depth >= 4);

  /* React to global collapse / expand signals */
  const [lastCollapseSignal, setLastCollapseSignal] = useState(collapseSignal);
  const [lastExpandSignal, setLastExpandSignal] = useState(expandSignal);

  if (collapseSignal !== lastCollapseSignal) {
    setLastCollapseSignal(collapseSignal);
    setCollapsed(true);
  }
  if (expandSignal !== lastExpandSignal) {
    setLastExpandSignal(expandSignal);
    setCollapsed(false);
  }

  const isOwner = session?.user?.id === comment.author.id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment.replies ? countAll(comment.replies) : 0;

  /* ── Reply ── */
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          postId,
          parentId: comment.id,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Failed to post reply:", res.status, errBody);
        return;
      }
      setReplyContent("");
      setShowReply(false);
      onReplyAdded();
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Edit ── */
  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Failed to edit comment:", res.status, errBody);
        return;
      }
      setEditing(false);
      onEdited();
    } catch (error) {
      console.error("Failed to edit comment:", error);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Failed to delete comment:", res.status, errBody);
        return;
      }
      setShowDeleteConfirm(false);
      onDeleted();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  /* ═══════════════════════
     Collapsed state
     ═══════════════════════ */
  if (collapsed) {
    return (
      <div className={`rc-comment rc-comment--collapsed${isLast ? " rc-comment--last" : ""}`}>
        <button
          className="rc-collapsed-bar"
          onClick={() => setCollapsed(false)}
          aria-label={t.comments.expand}
        >
          <span className="rc-toggle-circle rc-toggle-circle--expand">
            <PlusCircleIcon />
          </span>
          <Avatar name={comment.author.name} image={comment.author.image} size={20} />
          <span className="rc-collapsed-meta">
            <span className="rc-author">{comment.author.name || t.common.anonymous}</span>
            <RoleBadge role={comment.author.role} />
            <span className="rc-sep">&middot;</span>
            <span className="rc-time">{relativeTime(comment.createdAt)}</span>
            {hasReplies && (
              <>
                <span className="rc-sep">&middot;</span>
                <span className="rc-children-count">
                  ({replyCount} {replyCount === 1 ? t.comments.reply : t.comments.repliesWord})
                </span>
              </>
            )}
          </span>
        </button>
      </div>
    );
  }

  /* ═══════════════════════
     Expanded state
     ═══════════════════════ */
  return (
    <div className={`rc-comment${isLast ? " rc-comment--last" : ""}`}>
      {/* ── Head row: avatar + content side by side ── */}
      <div className="rc-comment-inner">
        {/* Avatar column */}
        <div className="rc-avatar-col">
          <Avatar name={comment.author.name} image={comment.author.image} size={32} />
          {/* Vertical connector from avatar down — shown when has replies */}
          {hasReplies && <div className="rc-avatar-line" aria-hidden="true" />}
        </div>

        {/* Comment body column */}
        <div className="rc-comment-main">
          {/* ── Header ── */}
          <div className="rc-header">
            <span className="rc-author">{comment.author.name || t.common.anonymous}</span>
            <RoleBadge role={comment.author.role} />
            <span className="rc-sep">&middot;</span>
            <time className="rc-time" dateTime={comment.createdAt}>
              {relativeTime(comment.createdAt)}
            </time>
          </div>

          {/* ── Body ── */}
          {editing ? (
            <div className="rc-edit-area">
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                placeholder={t.comments.writeComment}
                rows={3}
                compact
              />
              <div className="rc-edit-actions">
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
            <div className="rc-body">
              <MarkdownRenderer content={comment.content} />
            </div>
          )}

          {/* ── Action bar ── */}
          <div className="rc-actions">
            {hasReplies && (
              <button
                className="rc-collapse-btn"
                onClick={() => setCollapsed(true)}
                title={t.comments.collapse}
                aria-label={t.comments.collapse}
              >
                <MinusCircleIcon />
              </button>
            )}
            <ReactionBar commentId={comment.id} compact />

            {session && (
              <button
                className="rc-action-btn"
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
                  className="rc-action-btn"
                  onClick={() => {
                    setEditing(true);
                    setShowDeleteConfirm(false);
                  }}
                >
                  <EditIcon />
                  {t.common.edit}
                </button>
                <button
                  className="rc-action-btn rc-action-btn--danger"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                >
                  <TrashIcon />
                  {t.common.delete}
                </button>
              </>
            )}
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="rc-delete-confirm">
              <span>{t.comments.deleteConfirm}</span>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setShowDeleteConfirm(false)}
                >
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
            <div className="rc-reply-form">
              <Avatar name={session?.user?.name} image={session?.user?.image} size={24} />
              <div className="flex-1">
                <MarkdownEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder={t.comments.writeReply}
                  rows={2}
                  compact
                />
                <div className="rc-reply-form-actions">
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
        </div>
      </div>

      {/* Nested replies — sibling to inner row, full width */}
      {hasReplies && (
        <div className="rc-replies">
          {comment.replies!.map((reply, idx) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              isLast={idx === comment.replies!.length - 1}
              onReplyAdded={onReplyAdded}
              onDeleted={onDeleted}
              onEdited={onEdited}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   ComposeBox — new comment form
   ══════════════════════════════════════ */

function ComposeBox({
  value,
  onChange,
  onSubmit,
  submitting,
  placeholder,
  sessionUser,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  placeholder: string;
  sessionUser: { name?: string | null; image?: string | null };
}) {
  const { t } = useTranslation();
  const [showMention, setShowMention] = useState(false);

  const insertMention = useCallback(
    (username: string) => {
      onChange(value + `@${username} `);
      setShowMention(false);
    },
    [value, onChange]
  );

  return (
    <div className="rc-compose">
      <Avatar name={sessionUser.name} image={sessionUser.image} size={36} />
      <div className="rc-compose-body">
        <MarkdownEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          compact
        />

        {/* Formatting + mention toolbar */}
        <div className="rc-compose-toolbar">
          <div className="rc-compose-format-icons">
            <button
              type="button"
              className="rc-fmt-btn"
              title="Bold"
              onClick={() => onChange(value + "**text**")}
            >
              <BoldIcon />
            </button>
            <button
              type="button"
              className="rc-fmt-btn"
              title="Italic"
              onClick={() => onChange(value + "*text*")}
            >
              <ItalicIcon />
            </button>
            <button
              type="button"
              className="rc-fmt-btn"
              title="Code"
              onClick={() => onChange(value + "`code`")}
            >
              <CodeIcon />
            </button>
            <button
              type="button"
              className="rc-fmt-btn"
              title="Link"
              onClick={() => onChange(value + "[text](url)")}
            >
              <LinkIcon />
            </button>
            <div className="rc-fmt-divider" />
            <button
              type="button"
              className="rc-fmt-btn"
              title={t.comments.mentionUser}
              onClick={() => setShowMention(!showMention)}
            >
              <AtIcon />
            </button>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={onSubmit}
            disabled={submitting || !value.trim()}
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

        {/* Mention dropdown (simple inline) */}
        {showMention && (
          <div className="rc-mention-popup">
            <input
              type="text"
              placeholder={t.comments.mentionUser}
              className="rc-mention-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) insertMention(val);
                }
                if (e.key === "Escape") setShowMention(false);
              }}
            />
            <p className="rc-mention-hint">Type a username and press Enter</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Comments — root component
   ══════════════════════════════════════ */

export default function Comments({ postId, initialComments }: CommentsProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  /* Collapse-all / expand-all signals */
  const [collapseSignal, setCollapseSignal] = useState(0);
  const [expandSignal, setExpandSignal] = useState(0);
  const [allCollapsed, setAllCollapsed] = useState(false);

  const total = countAll(comments);

  const refreshComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch {
      /* silently ignore network errors on refresh */
    }
  }, [postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, postId }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Failed to post comment:", res.status, errBody);
        return;
      }
      setNewComment("");
      await refreshComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAll = () => {
    if (allCollapsed) {
      setExpandSignal((s) => s + 1);
    } else {
      setCollapseSignal((s) => s + 1);
    }
    setAllCollapsed(!allCollapsed);
  };

  /* Sort & filter */
  const processed = useMemo(() => {
    let list = filterComments(comments, searchQuery);

    list = [...list].sort((a, b) => {
      if (sortMode === "most-replies") {
        return countAll(b.replies || []) - countAll(a.replies || []);
      }
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortMode === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [comments, searchQuery, sortMode]);

  return (
    <CollapseContext.Provider value={{ collapseSignal, expandSignal }}>
      <section className="rc-section" aria-label="Comments">
        {/* ── Top bar ── */}
        <div className="rc-topbar">
          {/* Left: search */}
          <div className="rc-topbar-search">
            <SearchIcon />
            <input
              type="text"
              className="rc-search-input"
              placeholder={t.comments.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Center: counter */}
          <div className="rc-topbar-count">
            <ChatBubbleIcon />
            <span className="font-semibold">{t.comments.title.replace("{n}", String(total))}</span>
          </div>

          {/* Right: sort + collapse */}
          <div className="rc-topbar-controls">
            <select
              className="rc-sort-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="newest">{t.comments.sortNewest}</option>
              <option value="oldest">{t.comments.sortOldest}</option>
              <option value="most-replies">{t.comments.sortMostReplies}</option>
            </select>

            {comments.length > 0 && (
              <button
                className="rc-toggle-all-btn"
                onClick={handleToggleAll}
                title={allCollapsed ? t.comments.expandAll : t.comments.collapseAll}
              >
                {allCollapsed ? <PlusBoxIcon /> : <MinusBoxIcon />}
                <span className="hidden sm:inline">
                  {allCollapsed ? t.comments.expandAll : t.comments.collapseAll}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── New comment form ── */}
        {session ? (
          <ComposeBox
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleSubmit}
            submitting={submitting}
            placeholder={t.comments.writeComment}
            sessionUser={{
              name: session.user?.name,
              image: session.user?.image,
            }}
          />
        ) : (
          <div className="rc-signin-prompt">
            <ChatBubbleIcon />
            <p>
              <Link href="/auth/signin" className="link link-primary font-medium">
                {t.common.signIn}
              </Link>
              {t.comments.signInPrompt}
            </p>
          </div>
        )}

        {/* ── Comments list ── */}
        <div className="rc-list">
          {processed.length === 0 ? (
            <div className="rc-empty">
              <div className="rc-empty-icon">
                <ChatBubbleIcon large />
              </div>
              <p className="font-medium">{t.comments.noComments}</p>
              <p className="text-sm text-base-content/40">{t.comments.beFirst}</p>
            </div>
          ) : (
            processed.map((comment, idx) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                depth={0}
                isLast={idx === processed.length - 1}
                onReplyAdded={refreshComments}
                onDeleted={refreshComments}
                onEdited={refreshComments}
              />
            ))
          )}
        </div>
      </section>
    </CollapseContext.Provider>
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

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
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

function PlusCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v8m-4-4h8" />
    </svg>
  );
}

function MinusCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M8 12h8" />
    </svg>
  );
}

function PlusBoxIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function MinusBoxIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function BoldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6z"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0l-4 16m0 0h4m4-16l-4 16" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.282a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.656"
      />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
      />
    </svg>
  );
}
