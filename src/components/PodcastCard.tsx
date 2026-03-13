"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";
import { WHISPER_LANGUAGES } from "@/lib/captions";

interface PodcastCardProps {
  podcast: {
    slug: string;
    title: string;
    description?: string | null;
    coverImage?: string | null;
    audioUrl: string;
    duration?: number | null;
    language?: string | null;
    createdAt: string;
    author: { name?: string | null; image?: string | null };
    categories: { name: string; slug: string }[];
    tags: { name: string; slug: string }[];
    transcript?: string | null;
    transcripts?: { language: string }[];
  };
  /** Render as a wider featured/hero layout */
  featured?: boolean;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0)
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export default function PodcastCard({ podcast, featured = false }: PodcastCardProps) {
  const { t, language: uiLang } = useTranslation();

  const formattedDate = new Date(podcast.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

  /* ── Featured / Hero card ── */
  if (featured) {
    return (
      <article className="ted-card-featured group">
        <div className="flex flex-col lg:flex-row gap-0">
          {/* Thumbnail */}
          <Link
            href={`/podcasts/${podcast.slug}`}
            className="relative flex-shrink-0 w-full lg:w-[55%] aspect-video overflow-hidden"
          >
            {podcast.coverImage ? (
              <Image
                src={podcast.coverImage}
                alt={podcast.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="w-full h-full bg-neutral flex items-center justify-center">
                <WaveIcon className="w-20 h-20 text-neutral-content/20" />
              </div>
            )}
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            {/* Play circle */}
            <div className="ted-play-overlay">
              <PlayCircle size={64} />
            </div>
            {/* Duration pill */}
            {podcast.duration && (
              <div className="ted-duration-pill">{formatDuration(podcast.duration)}</div>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 flex flex-col p-6 lg:p-8 justify-center min-w-0">
            {/* Category */}
            {podcast.categories.length > 0 && (
              <Link
                href={`/podcasts?category=${podcast.categories[0].slug}`}
                className="ted-category-label"
              >
                {podcast.categories[0].name}
              </Link>
            )}

            <Link href={`/podcasts/${podcast.slug}`}>
              <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors duration-200 line-clamp-3">
                {podcast.title}
              </h2>
            </Link>

            {podcast.description && (
              <p className="text-base-content/55 leading-relaxed line-clamp-3 mb-4 text-[0.95rem]">
                {podcast.description}
              </p>
            )}

            {/* Author + Meta */}
            <div className="flex items-center gap-3 mt-auto">
              <div className="ted-avatar">
                {podcast.author.image ? (
                  <Image
                    src={podcast.author.image}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span>{podcast.author.name?.charAt(0)?.toUpperCase() || "?"}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{podcast.author.name || t.common.anonymous}</p>
                <div className="flex items-center gap-1.5 text-xs text-base-content/40">
                  <span>{formattedDate}</span>
                  {podcast.duration && (
                    <>
                      <span>·</span>
                      <span>{formatMinutes(podcast.duration)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  /* ── Regular card ── */
  return (
    <article className="ted-card group">
      {/* Thumbnail */}
      <Link href={`/podcasts/${podcast.slug}`} className="ted-card-thumb">
        {podcast.coverImage ? (
          <Image
            src={podcast.coverImage}
            alt={podcast.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-neutral flex items-center justify-center">
            <WaveIcon className="w-12 h-12 text-neutral-content/15" />
          </div>
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Play circle */}
        <div className="ted-play-overlay">
          <PlayCircle size={48} />
        </div>
        {/* Duration pill */}
        {podcast.duration && (
          <div className="ted-duration-pill">{formatDuration(podcast.duration)}</div>
        )}
        {/* Transcript badge */}
        {(podcast.transcript || (podcast.transcripts && podcast.transcripts.length > 0)) && (
          <div className="ted-transcript-badge">
            <TranscriptIcon className="w-3 h-3" />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="ted-card-body">
        {/* Category */}
        {podcast.categories.length > 0 && (
          <Link
            href={`/podcasts?category=${podcast.categories[0].slug}`}
            className="ted-category-label"
          >
            {podcast.categories[0].name}
          </Link>
        )}

        <Link href={`/podcasts/${podcast.slug}`}>
          <h3 className="font-bold text-[1.05rem] leading-snug mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-2">
            {podcast.title}
          </h3>
        </Link>

        {podcast.description && (
          <p className="text-sm text-base-content/50 leading-relaxed line-clamp-2 mb-3">
            {podcast.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2.5 pt-2">
          <div className="ted-avatar ted-avatar-sm">
            {podcast.author.image ? (
              <Image
                src={podcast.author.image}
                alt=""
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            ) : (
              <span>{podcast.author.name?.charAt(0)?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-base-content/45 min-w-0">
            <span className="font-medium text-base-content/65 truncate">
              {podcast.author.name || t.common.anonymous}
            </span>
            <span>·</span>
            <span className="whitespace-nowrap">{formattedDate}</span>
            {podcast.duration && (
              <>
                <span>·</span>
                <span className="whitespace-nowrap">{formatMinutes(podcast.duration)}</span>
              </>
            )}
            {podcast.language &&
              (() => {
                const langInfo = WHISPER_LANGUAGES.find((l) => l.code === podcast.language);
                return (
                  <>
                    <span>·</span>
                    <span className="whitespace-nowrap">
                      {langInfo
                        ? uiLang === "it"
                          ? langInfo.labelIt
                          : langInfo.label
                        : podcast.language.toUpperCase()}
                    </span>
                  </>
                );
              })()}
          </div>
        </div>
      </div>

      {/* Accent bottom line on hover */}
      <div className="ted-card-accent" />
    </article>
  );
}

/* ── Icons ── */

function PlayCircle({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="23" fill="rgba(0,0,0,0.55)" stroke="white" strokeWidth="2" />
      <path d="M20 16l12 8-12 8V16z" fill="white" />
    </svg>
  );
}

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
      />
    </svg>
  );
}

function TranscriptIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}
