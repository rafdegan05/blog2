"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

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
    if (!confirm("Delete this comment?")) return;
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
        <span className="font-semibold text-sm">{comment.author.name || "Anonymous"}</span>
        <span className="text-xs text-base-content/50">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm mb-2">{comment.content}</p>

      <div className="flex gap-2">
        {session && (
          <button className="btn btn-ghost btn-xs" onClick={() => setShowReply(!showReply)}>
            Reply
          </button>
        )}
        {session?.user?.id === comment.author.id && (
          <button className="btn btn-ghost btn-xs text-error" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>

      {showReply && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            className="input input-bordered input-sm flex-1"
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={submitting}>
            {submitting ? <span className="loading loading-spinner loading-xs" /> : "Send"}
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
      <h3 className="text-xl font-bold mb-4">Comments ({comments.length})</h3>

      {session ? (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="loading loading-spinner loading-sm" /> : "Comment"}
          </button>
        </div>
      ) : (
        <div className="alert mb-6">
          <span>
            <Link href="/auth/signin" className="link link-primary">
              Sign in
            </Link>{" "}
            to leave a comment.
          </span>
        </div>
      )}

      <div>
        {comments.length === 0 ? (
          <p className="text-base-content/50">No comments yet. Be the first!</p>
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
