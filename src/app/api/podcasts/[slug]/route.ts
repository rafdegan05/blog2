import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/podcasts/[slug]
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const podcast = await prisma.podcast.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      categories: true,
      tags: true,
    },
  });

  if (!podcast) {
    return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
  }

  return NextResponse.json(podcast);
}

// PUT /api/podcasts/[slug]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.podcast.findUnique({ where: { slug } });

  if (!existing) {
    return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
  }

  if (existing.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    audioUrl,
    coverImage,
    duration,
    published,
    categories,
    tags,
    transcript,
  } = body;

  const podcast = await prisma.podcast.update({
    where: { slug },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(audioUrl && { audioUrl }),
      ...(coverImage !== undefined && { coverImage }),
      ...(duration !== undefined && { duration }),
      ...(published !== undefined && { published }),
      ...(transcript !== undefined && { transcript }),
      ...(categories && {
        categories: {
          set: [],
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
        },
      }),
      ...(tags && {
        tags: {
          set: [],
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
        },
      }),
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      categories: true,
      tags: true,
    },
  });

  return NextResponse.json(podcast);
}

// DELETE /api/podcasts/[slug]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.podcast.findUnique({ where: { slug } });

  if (!existing) {
    return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
  }

  if (existing.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.podcast.delete({ where: { slug } });

  return NextResponse.json({ message: "Podcast deleted" });
}
