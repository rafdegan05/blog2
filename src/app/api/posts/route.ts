import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canCreateContent } from "@/lib/permissions";

function calcReadingTime(content?: string | null): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// GET /api/posts - List posts with pagination and search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const sort = searchParams.get("sort") || "latest";

  const where: Record<string, unknown> = { published: true, moderation: "APPROVED" };

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

  // Sorting
  let orderBy: Record<string, unknown> | Record<string, unknown>[];
  switch (sort) {
    case "popular":
      orderBy = { reactions: { _count: "desc" } };
      break;
    case "discussed":
      orderBy = { comments: { _count: "desc" } };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    default: // "latest"
      orderBy = { createdAt: "desc" };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
        categories: true,
        tags: true,
        reactions: { select: { type: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => {
      // Compute all reaction types by frequency (most popular first)
      const typeCounts: Record<string, number> = {};
      for (const r of p.reactions) {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
      }
      const topReactions = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type]) => type);

      const { reactions: _reactions, ...rest } = p;
      return { ...rest, topReactions, readingTime: calcReadingTime(p.content) };
    }),
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
              where: { name: cat },
              create: {
                name: cat,
                slug: cat
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              },
            })),
          }
        : undefined,
      tags: tags?.length
        ? {
            connectOrCreate: tags.map((t: string) => ({
              where: { name: t },
              create: {
                name: t,
                slug: t
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              },
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
