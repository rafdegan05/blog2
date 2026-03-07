import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function calcReadingTime(content?: string | null): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// GET /api/posts/[slug]
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      categories: true,
      tags: true,
      comments: {
        where: { parentId: null },
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
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PUT /api/posts/[slug]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingPost = await prisma.post.findUnique({ where: { slug } });

  if (!existingPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (existingPost.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, content, excerpt, coverImage, published, categories, tags } = body;

  const post = await prisma.post.update({
    where: { slug },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(coverImage !== undefined && { coverImage }),
      ...(published !== undefined && { published }),
      ...(categories && {
        categories: {
          set: [],
          connectOrCreate: categories.map((cat: string) => ({
            where: { slug: cat.toLowerCase().replace(/\s+/g, "-") },
            create: { name: cat, slug: cat.toLowerCase().replace(/\s+/g, "-") },
          })),
        },
      }),
      ...(tags && {
        tags: {
          set: [],
          connectOrCreate: tags.map((t: string) => ({
            where: { slug: t.toLowerCase().replace(/\s+/g, "-") },
            create: { name: t, slug: t.toLowerCase().replace(/\s+/g, "-") },
          })),
        },
      }),
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      categories: true,
      tags: true,
    },
  });

  return NextResponse.json(post);
}

// DELETE /api/posts/[slug]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingPost = await prisma.post.findUnique({ where: { slug } });

  if (!existingPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (existingPost.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { slug } });

  return NextResponse.json({ message: "Post deleted" });
}
