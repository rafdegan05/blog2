import { notFound } from "next/navigation";
import PodcastDetailContent from "@/components/PodcastDetailContent";
import type { Metadata } from "next";

interface PodcastPageProps {
  params: Promise<{ slug: string }>;
}

async function getPodcast(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/podcasts/${slug}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PodcastPageProps): Promise<Metadata> {
  const { slug } = await params;
  const podcast = await getPodcast(slug);
  if (!podcast) return { title: "Podcast Not Found" };
  return {
    title: `${podcast.title} | Blog & Podcast`,
    description: podcast.description || `Listen to ${podcast.title}`,
  };
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const { slug } = await params;
  const podcast = await getPodcast(slug);

  if (!podcast) notFound();

  return <PodcastDetailContent podcast={podcast} />;
}
