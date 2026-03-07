import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const VALID_TYPES = [
  "LIKE",
  "DISLIKE",
  "LOVE",
  "LAUGH",
  "SURPRISE",
  "SAD",
  "FIRE",
  "CLAP",
  "THINK",
  "ANGRY",
  "ROCKET",
  "EYES",
  "HUNDRED",
  "PRAY",
  "SKULL",
  "HEART_EYES",
] as const;

// GET /api/reactions?postId=...&podcastId=...&commentId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const podcastId = searchParams.get("podcastId");
  const commentId = searchParams.get("commentId");

  if (!postId && !podcastId && !commentId) {
    return NextResponse.json(
      { error: "postId, podcastId, or commentId is required" },
      { status: 400 }
    );
  }

  const where: Record<string, unknown> = {};
  if (postId) where.postId = postId;
  if (podcastId) where.podcastId = podcastId;
  if (commentId) where.commentId = commentId;

  const reactions = await prisma.reaction.findMany({ where });

  // Aggregate counts by type
  const counts: Record<string, number> = {};
  for (const r of reactions) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }

  // Get current user's reaction if authenticated
  const session = await auth();
  let userReaction: string | null = null;
  if (session?.user?.id) {
    const existing = reactions.find((r) => r.userId === session.user!.id);
    if (existing) userReaction = existing.type;
  }

  return NextResponse.json({ counts, userReaction, total: reactions.length });
}

// POST /api/reactions – toggle or change reaction
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, postId, podcastId, commentId } = body;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid reaction type. Valid: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!postId && !podcastId && !commentId) {
    return NextResponse.json(
      { error: "postId, podcastId, or commentId is required" },
      { status: 400 }
    );
  }

  // Find existing reaction by this user on this target
  const where: Record<string, unknown> = { userId: session.user.id };
  if (postId) where.postId = postId;
  if (podcastId) where.podcastId = podcastId;
  if (commentId) where.commentId = commentId;

  const existing = await prisma.reaction.findFirst({ where });

  if (existing) {
    if (existing.type === type) {
      // Same reaction → remove it (toggle off)
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed", type });
    } else {
      // Different reaction → update
      const updated = await prisma.reaction.update({
        where: { id: existing.id },
        data: { type },
      });
      return NextResponse.json({ action: "changed", type: updated.type });
    }
  }

  // Create new reaction
  const reaction = await prisma.reaction.create({
    data: {
      type,
      userId: session.user.id,
      postId: postId || null,
      podcastId: podcastId || null,
      commentId: commentId || null,
    },
  });

  return NextResponse.json({ action: "added", type: reaction.type }, { status: 201 });
}
