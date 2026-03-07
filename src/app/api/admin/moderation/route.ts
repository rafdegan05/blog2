import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { ModerationStatus } from "@/generated/prisma/enums";

// GET /api/admin/moderation – List all content for moderation (admin only)
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";

  const moderationWhere = status !== "all" ? { moderation: status as ModerationStatus } : {};

  let posts: unknown[] = [];
  let podcasts: unknown[] = [];

  if (type === "all" || type === "posts") {
    posts = await prisma.post.findMany({
      where: moderationWhere,
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        categories: true,
        tags: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (type === "all" || type === "podcasts") {
    podcasts = await prisma.podcast.findMany({
      where: moderationWhere,
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        categories: true,
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json({ posts, podcasts });
}

// PUT /api/admin/moderation – Update moderation status
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, type, status, flagReason } = await request.json();

  if (!id || !type || !status) {
    return NextResponse.json({ error: "id, type, and status are required" }, { status: 400 });
  }

  if (!Object.values(ModerationStatus).includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${Object.values(ModerationStatus).join(", ")}` },
      { status: 400 }
    );
  }

  const data = {
    moderation: status as ModerationStatus,
    flagReason: status === "FLAGGED" ? flagReason || null : null,
    // Auto-unpublish flagged/rejected content
    ...(status === "FLAGGED" || status === "REJECTED" ? { published: false } : {}),
  };

  if (type === "post") {
    const post = await prisma.post.update({
      where: { id },
      data,
    });
    return NextResponse.json(post);
  } else if (type === "podcast") {
    const podcast = await prisma.podcast.update({
      where: { id },
      data,
    });
    return NextResponse.json(podcast);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
