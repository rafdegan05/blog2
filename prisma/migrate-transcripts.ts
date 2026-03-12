/**
 * One-time migration: copies Podcast.transcript → PodcastTranscript rows,
 * then nullifies the old column so it can be dropped in a future release.
 *
 * Safe to re-run: skips podcasts that already have a PodcastTranscript row.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find all podcasts that still have the old transcript column populated
  // but don't yet have any PodcastTranscript rows
  const podcasts = await prisma.podcast.findMany({
    where: {
      transcript: { not: null },
      transcripts: { none: {} },
    },
    select: { id: true, transcript: true },
  });

  if (podcasts.length === 0) {
    console.log("✅ No transcripts to migrate.");
    return;
  }

  console.log(`📦 Migrating ${podcasts.length} transcript(s)…`);

  for (const p of podcasts) {
    if (!p.transcript) continue;

    await prisma.podcastTranscript.create({
      data: {
        podcastId: p.id,
        language: "en", // default language for legacy data
        content: p.transcript,
      },
    });

    // Clear the old column so the migration is idempotent
    await prisma.podcast.update({
      where: { id: p.id },
      data: { transcript: null },
    });
  }

  console.log(`✅ Migrated ${podcasts.length} transcript(s) to PodcastTranscript.`);
}

main()
  .catch((e) => {
    console.error("❌ Transcript migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
