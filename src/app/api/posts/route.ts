import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canCreateContent } from "@/lib/permissions";

// GET /api/posts - List posts with pagination and search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";

  const where: Record<string, unknown> = { published: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.categories = { some: { slug: category } };
  }

  if (tag) {
    where.tags = { some: { slug: tag } };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
        categories: true,
        tags: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canCreateContent(session.user.role)) {
    return NextResponse.json(
      { error: "Forbidden – Author or Admin role required to create posts" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, content, excerpt, coverImage, published, categories, tags } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Ensure unique slug
  const existingPost = await prisma.post.findUnique({ where: { slug } });
  const finalSlug = existingPost ? `${slug}-${Date.now()}` : slug;

  const post = await prisma.post.create({
    data: {
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || content.substring(0, 200),
      coverImage,
      published: published || false,
      authorId: session.user.id,
      categories: categories?.length
        ? {
            connectOrCreate: categories.map((cat: string) => ({
              where: { slug: cat.toLowerCase().replace(/\s+/g, "-") },
              create: { name: cat, slug: cat.toLowerCase().replace(/\s+/g, "-") },
            })),
          }
        : undefined,
      tags: tags?.length
        ? {
            connectOrCreate: tags.map((t: string) => ({
              where: { slug: t.toLowerCase().replace(/\s+/g, "-") },
              create: { name: t, slug: t.toLowerCase().replace(/\s+/g, "-") },
            })),
          }
        : undefined,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      categories: true,
      tags: true,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
