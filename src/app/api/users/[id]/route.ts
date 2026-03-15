import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id] – Public user profile
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bannerImage: true,
      bio: true,
      role: true,
      banned: true,
      createdAt: true,
      _count: {
        select: {
          posts: { where: { published: true, moderation: "APPROVED" } },
          podcasts: { where: { published: true, moderation: "APPROVED" } },
          comments: true,
        },
      },
      posts: {
        where: { published: true, moderation: "APPROVED" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          content: true,
          createdAt: true,
          categories: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!user || user.banned) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Add reading time to posts
  const posts = user.posts.map((p) => {
    const words = p.content?.trim().split(/\s+/).length ?? 0;
    return {
      ...p,
      content: undefined, // Don't send full content in listing
      readingTime: Math.max(1, Math.round(words / 200)),
    };
  });

  // Strip banned field from response
  const { banned: _, ...userData } = user;
  void _;

  return NextResponse.json({
    ...userData,
    posts,
  });
}
