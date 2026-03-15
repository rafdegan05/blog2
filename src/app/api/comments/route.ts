import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** Reusable include for nested replies (up to 4 levels deep) */
const repliesInclude = (depth: number): object =>
  depth <= 0
    ? { author: { select: { id: true, name: true, image: true, role: true } } }
    : {
        author: { select: { id: true, name: true, image: true, role: true } },
        replies: {
          include: repliesInclude(depth - 1),
          orderBy: { createdAt: "asc" as const },
        },
      };

// GET /api/comments?postId=xxx - Get comments for a post
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: repliesInclude(4) as Record<string, unknown>,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[GET /api/comments] Error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

// POST /api/comments - Create a comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, postId, parentId } = body;

    if (!content || !postId) {
      return NextResponse.json({ error: "Content and postId are required" }, { status: 400 });
    }

    // Verify the user still exists in the DB (JWT may outlive the DB row)
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json(
        { error: "User not found – please sign out and sign in again" },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[POST /api/comments] Error:", msg);
    if (stack) console.error("[POST /api/comments] Stack:", stack);
    return NextResponse.json({ error: "Failed to create comment", detail: msg }, { status: 500 });
  }
}
