import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/comments/[id] - Update a comment
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const existing = await prisma.comment.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existing.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const comment = await prisma.comment.update({
      where: { id },
      data: { content: body.content },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[PUT /api/comments/${id}] Error:`, msg);
    if (error instanceof Error && error.stack) console.error(error.stack);
    return NextResponse.json({ error: "Failed to update comment", detail: msg }, { status: 500 });
  }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const existing = await prisma.comment.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existing.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[DELETE /api/comments/${id}] Error:`, msg);
    if (error instanceof Error && error.stack) console.error(error.stack);
    return NextResponse.json({ error: "Failed to delete comment", detail: msg }, { status: 500 });
  }
}
