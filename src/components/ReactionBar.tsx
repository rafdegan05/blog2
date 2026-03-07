"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "LAUGH", emoji: "😂", label: "Laugh" },
  { type: "FIRE", emoji: "🔥", label: "Fire" },
  { type: "CLAP", emoji: "👏", label: "Clap" },
  { type: "ROCKET", emoji: "🚀", label: "Rocket" },
  { type: "THINK", emoji: "🤔", label: "Think" },
  { type: "SURPRISE", emoji: "😮", label: "Surprise" },
  { type: "SAD", emoji: "😢", label: "Sad" },
  { type: "ANGRY", emoji: "😡", label: "Angry" },
  { type: "EYES", emoji: "👀", label: "Eyes" },
  { type: "HUNDRED", emoji: "💯", label: "100" },
  { type: "PRAY", emoji: "🙏", label: "Pray" },
  { type: "SKULL", emoji: "💀", label: "Skull" },
  { type: "HEART_EYES", emoji: "😍", label: "Heart Eyes" },
] as const;

interface ReactionBarProps {
  postId?: string;
  podcastId?: string;
  commentId?: string;
  /** Compact mode for comments */
  compact?: boolean;
}

export default function ReactionBar({
  postId,
  podcastId,
  commentId,
  compact = false,
}: ReactionBarProps) {
  const { data: session } = useSession();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const queryParams = postId
    ? `postId=${postId}`
    : podcastId
      ? `podcastId=${podcastId}`
      : `commentId=${commentId}`;

  const fetchReactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/reactions?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
        setUserReaction(data.userReaction);
      }
    } catch {
      // silent
    }
  }, [queryParams]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const handleReaction = async (type: string) => {
    if (!session) return;
    setLoading(true);
    setShowPicker(false);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          postId: postId || undefined,
          podcastId: podcastId || undefined,
          commentId: commentId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.action === "removed") {
          setCounts((prev) => {
            const next = { ...prev };
            next[type] = Math.max(0, (next[type] || 0) - 1);
            if (next[type] === 0) delete next[type];
            return next;
          });
          setUserReaction(null);
        } else if (data.action === "changed") {
          setCounts((prev) => {
            const next = { ...prev };
            if (userReaction) {
              next[userReaction] = Math.max(0, (next[userReaction] || 0) - 1);
              if (next[userReaction] === 0) delete next[userReaction];
            }
            next[data.type] = (next[data.type] || 0) + 1;
            return next;
          });
          setUserReaction(data.type);
        } else {
          setCounts((prev) => ({
            ...prev,
            [data.type]: (prev[data.type] || 0) + 1,
          }));
          setUserReaction(data.type);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  // Active reactions to display (those with count > 0)
  const activeReactions = REACTIONS.filter((r) => counts[r.type]);

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {/* Show existing reactions */}
        {activeReactions.map((r) => (
          <button
            key={r.type}
            onClick={() => handleReaction(r.type)}
            disabled={!session || loading}
            className={`btn btn-xs gap-1 ${userReaction === r.type ? "btn-primary" : "btn-ghost"}`}
            title={r.label}
          >
            <span>{r.emoji}</span>
            <span className="text-xs">{counts[r.type]}</span>
          </button>
        ))}

        {/* Add reaction button */}
        <div className="relative">
          <button
            onClick={() => session && setShowPicker(!showPicker)}
            disabled={!session || loading}
            className="btn btn-ghost btn-xs btn-circle"
            title={session ? "Add reaction" : "Sign in to react"}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>

          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div className="absolute bottom-full left-0 mb-1 z-50 flex gap-1 bg-base-100 shadow-lg rounded-box p-1.5 border border-base-300">
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    className={`btn btn-ghost btn-xs btn-circle text-base hover:scale-125 transition-transform ${
                      userReaction === r.type ? "bg-primary/20" : ""
                    }`}
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Full-size mode for posts and podcasts
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Reaction buttons */}
      {REACTIONS.map((r) => {
        const count = counts[r.type] || 0;
        const isActive = userReaction === r.type;
        return (
          <button
            key={r.type}
            onClick={() => handleReaction(r.type)}
            disabled={!session || loading}
            className={`btn btn-sm gap-1.5 transition-all ${
              isActive
                ? "btn-primary"
                : count > 0
                  ? "btn-ghost border border-base-300"
                  : "btn-ghost opacity-60 hover:opacity-100"
            }`}
            title={session ? r.label : "Sign in to react"}
          >
            <span className="text-base">{r.emoji}</span>
            {count > 0 && <span className="text-xs font-semibold">{count}</span>}
          </button>
        );
      })}

      {totalReactions > 0 && (
        <span className="text-sm text-base-content/50 ml-1">
          {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"}
        </span>
      )}
    </div>
  );
}
