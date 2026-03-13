import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canCreateContent } from "@/lib/permissions";

// GET /api/podcasts - List podcasts with pagination and search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";

  const where: Record<string, unknown> = { published: true, moderation: "APPROVED" };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.categories = { some: { slug: category } };
  }

  if (tag) {
    where.tags = { some: { slug: tag } };
  }

  const [podcasts, total] = await Promise.all([
    prisma.podcast.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
        categories: true,
        tags: true,
        transcripts: { select: { language: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.podcast.count({ where }),
  ]);

  return NextResponse.json({
    podcasts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/podcasts - Create a new podcast
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canCreateContent(session.user.role)) {
    return NextResponse.json(
      { error: "Forbidden – Author or Admin role required to create podcasts" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    title,
    description,
    audioUrl,
    coverImage,
    duration,
    language,
    published,
    categories,
    tags,
    transcripts,
  } = body;

  if (!title || !audioUrl) {
    return NextResponse.json({ error: "Title and audio URL are required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existingPodcast = await prisma.podcast.findUnique({ where: { slug } });
  const finalSlug = existingPodcast ? `${slug}-${Date.now()}` : slug;

  const podcast = await prisma.podcast.create({
    data: {
      title,
      slug: finalSlug,
      description,
      audioUrl,
      coverImage,
      duration,
      language: language || undefined,
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
      transcripts:
        transcripts && Array.isArray(transcripts) && transcripts.length > 0
          ? {
              create: transcripts
                .filter((tr: { language: string; content: string }) => tr.content)
                .map((tr: { language: string; content: string }) => ({
                  language: tr.language,
                  content: tr.content,
                })),
            }
          : undefined,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      categories: true,
      tags: true,
      transcripts: { select: { language: true, content: true } },
    },
  });

  return NextResponse.json(podcast, { status: 201 });
}
