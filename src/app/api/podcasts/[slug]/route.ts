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
      transcripts: { select: { language: true, content: true } },
    },
  });

  if (!podcast) {
    return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
  }

  // Backward compat: if old transcript column has data but no PodcastTranscript rows exist,
  // synthesize a transcripts array so the UI works during migration
  const response: Record<string, unknown> = { ...podcast };
  if ((!podcast.transcripts || podcast.transcripts.length === 0) && podcast.transcript) {
    response.transcripts = [{ language: "en", content: podcast.transcript }];
  }

  return NextResponse.json(response);
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
    language,
    published,
    categories,
    tags,
    transcripts,
  } = body;

  const podcast = await prisma.podcast.update({
    where: { slug },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(audioUrl && { audioUrl }),
      ...(coverImage !== undefined && { coverImage }),
      ...(duration !== undefined && { duration }),
      ...(language !== undefined && { language: language || null }),
      ...(published !== undefined && { published }),
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
      transcripts: { select: { language: true, content: true } },
    },
  });

  // Upsert transcripts if provided
  if (transcripts && Array.isArray(transcripts)) {
    // Get existing transcript languages for this podcast
    const existingTranscripts = await prisma.podcastTranscript.findMany({
      where: { podcastId: existing.id },
      select: { language: true },
    });
    const existingLangs = new Set(existingTranscripts.map((t) => t.language));
    const incomingLangs = new Set(
      transcripts
        .filter((tr: { language: string; content: string }) => tr.content)
        .map((tr: { language: string; content: string }) => tr.language)
    );

    // Delete transcripts for languages no longer present
    const toDelete = [...existingLangs].filter((lang) => !incomingLangs.has(lang));
    if (toDelete.length > 0) {
      await prisma.podcastTranscript.deleteMany({
        where: { podcastId: existing.id, language: { in: toDelete } },
      });
    }

    // Upsert each transcript
    for (const tr of transcripts as { language: string; content: string }[]) {
      if (!tr.content) continue;
      await prisma.podcastTranscript.upsert({
        where: { podcastId_language: { podcastId: existing.id, language: tr.language } },
        create: { podcastId: existing.id, language: tr.language, content: tr.content },
        update: { content: tr.content },
      });
    }

    // Re-fetch with updated transcripts
    const updated = await prisma.podcast.findUnique({
      where: { slug: podcast.slug },
      include: {
        author: { select: { id: true, name: true, image: true } },
        categories: true,
        tags: true,
        transcripts: { select: { language: true, content: true } },
      },
    });
    return NextResponse.json(updated);
  }

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
