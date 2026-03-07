import Link from "next/link";
import Image from "next/image";

interface PodcastCardProps {
  podcast: {
    slug: string;
    title: string;
    description?: string | null;
    coverImage?: string | null;
    audioUrl: string;
    duration?: number | null;
    createdAt: string;
    author: { name?: string | null; image?: string | null };
    categories: { name: string; slug: string }[];
    tags: { name: string; slug: string }[];
  };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PodcastCard({ podcast }: PodcastCardProps) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300">
      {podcast.coverImage && (
        <figure className="relative h-48">
          <Image src={podcast.coverImage} alt={podcast.title} fill className="object-cover" />
        </figure>
      )}
      <div className="card-body">
        <h2 className="card-title">
          <Link href={`/podcasts/${podcast.slug}`} className="hover:text-primary transition-colors">
            {podcast.title}
          </Link>
        </h2>

        {podcast.description && (
          <p className="text-base-content/70 line-clamp-3">{podcast.description}</p>
        )}

        <div className="flex flex-wrap gap-1 mt-2">
          {podcast.categories.map((cat) => (
            <span key={cat.slug} className="badge badge-secondary badge-sm">
              {cat.name}
            </span>
          ))}
          {podcast.tags.map((tag) => (
            <span key={tag.slug} className="badge badge-outline badge-sm">
              {tag.name}
            </span>
          ))}
        </div>

        {/* Audio Player */}
        <div className="mt-3">
          <audio controls className="w-full" preload="metadata">
            <source src={podcast.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>

        <div className="card-actions justify-between items-center mt-2">
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <span>{podcast.author.name || "Anonymous"}</span>
            <span>·</span>
            <span>{new Date(podcast.createdAt).toLocaleDateString()}</span>
            {podcast.duration && (
              <>
                <span>·</span>
                <span>🎧 {formatDuration(podcast.duration)}</span>
              </>
            )}
          </div>
          <Link href={`/podcasts/${podcast.slug}`} className="btn btn-secondary btn-sm">
            Listen
          </Link>
        </div>
      </div>
    </div>
  );
}
