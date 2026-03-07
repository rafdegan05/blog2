import { notFound } from "next/navigation";
import EditButton from "@/components/EditButton";
import ReactionBar from "@/components/ReactionBar";
import Link from "next/link";
import Image from "next/image";
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

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0)
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const { slug } = await params;
  const podcast = await getPodcast(slug);

  if (!podcast) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/podcasts">Podcasts</Link>
          </li>
          <li>{podcast.title}</li>
        </ul>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover Image */}
            {podcast.coverImage && (
              <div className="relative flex-shrink-0 w-full md:w-64 h-64">
                <Image
                  src={podcast.coverImage}
                  alt={podcast.title}
                  fill
                  className="object-cover rounded-xl"
                  priority
                />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{podcast.title}</h1>
              <EditButton href={`/podcasts/edit/${podcast.slug}`} authorId={podcast.author.id} />

              <div className="flex items-center gap-4 text-base-content/60 mb-4">
                <div className="flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content w-8 rounded-full flex items-center justify-center">
                      {podcast.author.image ? (
                        <Image
                          src={podcast.author.image}
                          alt=""
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-xs">
                          {podcast.author.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span>{podcast.author.name || "Anonymous"}</span>
                </div>
                <span>·</span>
                <span>
                  {new Date(podcast.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {podcast.duration && (
                  <>
                    <span>·</span>
                    <span>🎧 {formatDuration(podcast.duration)}</span>
                  </>
                )}
              </div>

              {/* Tags and Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {podcast.categories?.map((cat: { slug: string; name: string }) => (
                  <span key={cat.slug} className="badge badge-secondary">
                    {cat.name}
                  </span>
                ))}
                {podcast.tags?.map((tag: { slug: string; name: string }) => (
                  <span key={tag.slug} className="badge badge-outline">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">🎧 Listen Now</h3>
            <audio controls className="w-full" preload="metadata">
              <source src={podcast.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Reactions */}
          <div className="mt-6">
            <ReactionBar podcastId={podcast.id} />
          </div>

          {/* Description */}
          {podcast.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-base-content/70 whitespace-pre-wrap">{podcast.description}</p>
            </div>
          )}

          {/* Author Bio */}
          {podcast.author.bio && (
            <div className="mt-6 p-4 bg-base-300 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content w-12 rounded-full flex items-center justify-center">
                    {podcast.author.image ? (
                      <Image
                        src={podcast.author.image}
                        alt=""
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <span>{podcast.author.name?.charAt(0)?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold">{podcast.author.name}</h4>
                  <p className="text-base-content/60 text-sm">{podcast.author.bio}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
