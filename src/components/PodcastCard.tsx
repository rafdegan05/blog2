"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";
import { WHISPER_LANGUAGES } from "@/lib/captions";
import WaveformPlayer from "@/components/WaveformPlayer";

interface PodcastCardProps {
  podcast: {
    slug: string;
    title: string;
    description?: string | null;
    coverImage?: string | null;
    audioUrl: string;
    duration?: number | null;
    language?: string | null;
    waveform?: number[] | null;
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
    day: "numeric",
  });

  const hasTranscript =
    podcast.transcript || (podcast.transcripts && podcast.transcripts.length > 0);

  /* ── Featured / Hero card ── */
  if (featured) {
    return (
      <Link href={`/podcasts/${podcast.slug}`} className="group block">
        <article className="post-card-featured">
          {/* Cover image */}
          {podcast.coverImage ? (
            <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl mb-6">
              <Image
                src={podcast.coverImage}
                alt={podcast.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-base-100/60 to-transparent" />
              {podcast.duration && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                  {formatDuration(podcast.duration)}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-xl mb-6 bg-base-200 flex items-center justify-center">
              <WaveIcon className="w-16 h-16 opacity-20" />
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {podcast.categories.map((cat) => (
              <span key={cat.slug} className="badge badge-primary badge-sm font-medium">
                {cat.name}
              </span>
            ))}
            {hasTranscript && (
              <span className="badge badge-ghost badge-sm gap-1">
                <TranscriptIcon className="w-3 h-3" />
                Transcript
              </span>
            )}
            <span className="text-xs text-base-content/50">{formattedDate}</span>
            {podcast.duration && (
              <>
                <span className="text-xs text-base-content/30">·</span>
                <span className="text-xs text-base-content/50">
                  {formatMinutes(podcast.duration)}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors duration-200 leading-tight">
            {podcast.title}
          </h2>

          {/* Description */}
          {podcast.description && (
            <p className="text-base-content/60 text-lg leading-relaxed line-clamp-3 mb-4">
              {podcast.description}
            </p>
          )}

          {/* Waveform player */}
          <div className="mb-4" onClick={(e) => e.preventDefault()}>
            <WaveformPlayer src={podcast.audioUrl} peaks={podcast.waveform} compact />
          </div>

          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
                {podcast.author.image ? (
                  <Image
                    src={podcast.author.image}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {podcast.author.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-base-content/70">
              {podcast.author.name || t.common.anonymous}
            </span>
          </div>
        </article>
      </Link>
    );
  }

  /* ── Regular card ── */
  return (
    <Link href={`/podcasts/${podcast.slug}`} className="group block">
      <article className="post-card h-full flex flex-col">
        {/* Cover image */}
        {podcast.coverImage ? (
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-4">
            <Image
              src={podcast.coverImage}
              alt={podcast.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {podcast.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[0.7rem] font-semibold px-1.5 py-0.5 rounded">
                {formatDuration(podcast.duration)}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[16/10] rounded-lg mb-4 bg-base-200 flex items-center justify-center">
            <WaveIcon className="w-10 h-10 opacity-15" />
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {podcast.categories.map((cat) => (
            <span key={cat.slug} className="badge badge-primary badge-xs font-medium">
              {cat.name}
            </span>
          ))}
          {hasTranscript && (
            <span className="badge badge-ghost badge-xs gap-1">
              <TranscriptIcon className="w-2.5 h-2.5" />
            </span>
          )}
          <span className="text-xs text-base-content/50">{formattedDate}</span>
          {podcast.duration && (
            <>
              <span className="text-xs text-base-content/30">·</span>
              <span className="text-xs text-base-content/50">
                {formatMinutes(podcast.duration)}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-200 leading-snug line-clamp-2">
          {podcast.title}
        </h3>

        {/* Description */}
        {podcast.description && (
          <p className="text-sm text-base-content/60 leading-relaxed line-clamp-2 mb-3">
            {podcast.description}
          </p>
        )}

        {/* Compact waveform player */}
        <div className="mb-3" onClick={(e) => e.preventDefault()}>
          <WaveformPlayer src={podcast.audioUrl} peaks={podcast.waveform} compact />
        </div>

        {/* Footer: author + language */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-base-200">
          <div className="flex items-center gap-2">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                {podcast.author.image ? (
                  <Image
                    src={podcast.author.image}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-medium">
                    {podcast.author.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-base-content/60">
              {podcast.author.name || t.common.anonymous}
            </span>
          </div>

          {podcast.language &&
            (() => {
              const langInfo = WHISPER_LANGUAGES.find((l) => l.code === podcast.language);
              return (
                <span className="text-xs text-base-content/40">
                  {langInfo
                    ? uiLang === "it"
                      ? langInfo.labelIt
                      : langInfo.label
                    : podcast.language.toUpperCase()}
                </span>
              );
            })()}
        </div>

        {/* Tags */}
        {podcast.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {podcast.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.slug}
                className="text-[10px] text-base-content/40 font-medium uppercase tracking-wider"
              >
                #{tag.name}
              </span>
            ))}
            {podcast.tags.length > 3 && (
              <span className="text-[10px] text-base-content/30">+{podcast.tags.length - 3}</span>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}

/* ── Icons ── */

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
