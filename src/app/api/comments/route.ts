import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/comments?postId=xxx - Get comments for a post
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

// POST /api/comments - Create a comment
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, postId, parentId } = body;

  if (!content || !postId) {
    return NextResponse.json({ error: "Content and postId are required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: session.user.id,
      parentId: parentId || null,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
