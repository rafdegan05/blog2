"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactionBar from "@/components/ReactionBar";
import { useTranslation } from "@/components/LanguageProvider";

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

function CommentItem({
  comment,
  postId,
  onReplyAdded,
  onDeleted,
}: {
  comment: CommentData;
  postId: string;
  onReplyAdded: () => void;
  onDeleted: () => void;
}) {
  const { data: session } = useSession();
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

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

  const handleDelete = async () => {
    if (!confirm(t.comments.deleteConfirm)) return;
    await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    onDeleted();
  };

  return (
    <div className="border-l-2 border-base-300 pl-4 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="avatar placeholder">
          <div className="bg-neutral text-neutral-content w-8 rounded-full flex items-center justify-center">
            {comment.author.image ? (
              <Image
                src={comment.author.image}
                alt=""
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <span className="text-xs">
                {comment.author.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
        </div>
        <span className="font-semibold text-sm">{comment.author.name || t.common.anonymous}</span>
        <span className="text-xs text-base-content/50">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm mb-2">{comment.content}</p>

      <div className="mb-1">
        <ReactionBar commentId={comment.id} compact />
      </div>

      <div className="flex gap-2">
        {session && (
          <button className="btn btn-ghost btn-xs" onClick={() => setShowReply(!showReply)}>
            {t.comments.reply}
          </button>
        )}
        {session?.user?.id === comment.author.id && (
          <button className="btn btn-ghost btn-xs text-error" onClick={handleDelete}>
            {t.common.delete}
          </button>
        )}
      </div>

      {showReply && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            className="input input-bordered input-sm flex-1"
            placeholder={t.comments.writeReply}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={submitting}>
            {submitting ? <span className="loading loading-spinner loading-xs" /> : t.comments.send}
          </button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onReplyAdded={onReplyAdded}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Comments({ postId, initialComments }: CommentsProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">
        {t.comments.title.replace("{n}", String(comments.length))}
      </h3>

      {session ? (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder={t.comments.writeComment}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              t.comments.comment
            )}
          </button>
        </div>
      ) : (
        <div className="alert mb-6">
          <span>
            <Link href="/auth/signin" className="link link-primary">
              {t.common.signIn}
            </Link>{" "}
            {t.comments.signInPrompt}
          </span>
        </div>
      )}

      <div>
        {comments.length === 0 ? (
          <p className="text-base-content/50">{t.comments.noComments}</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReplyAdded={refreshComments}
              onDeleted={refreshComments}
            />
          ))
        )}
      </div>
    </div>
  );
}
