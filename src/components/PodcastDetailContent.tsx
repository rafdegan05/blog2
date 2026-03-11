"use client";

import { useState, useCallback, useMemo } from "react";
import EditButton from "@/components/EditButton";
import ReactionBar from "@/components/ReactionBar";
import ShareButtons from "@/components/ShareButtons";
import ScrollIndicator from "@/components/ScrollIndicator";
import WaveformPlayer from "@/components/WaveformPlayer";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";
import {
  parseCaptions,
  detectFormat,
  serializeToSRT,
  serializeToVTT,
  serializeToPlainText,
  formatTimestampShort,
  type CaptionCue,
  type CaptionFormat,
} from "@/lib/captions";

interface PodcastDetailContentProps {
  podcast: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    audioUrl: string;
    coverImage?: string;
    duration?: number;
    transcript?: string | null;
    createdAt: string;
    author: {
      id: string;
      name?: string;
      image?: string;
      bio?: string;
    };
    categories?: { slug: string; name: string }[];
    tags?: { slug: string; name: string }[];
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

export default function PodcastDetailContent({ podcast }: PodcastDetailContentProps) {
  const { t, language } = useTranslation();
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "transcript">("description");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const parsedCues = useMemo<CaptionCue[]>(() => {
    if (!podcast.transcript) return [];
    const { cues } = parseCaptions(podcast.transcript);
    return cues;
  }, [podcast.transcript]);

  const detectedFormat = useMemo<CaptionFormat>(() => {
    if (!podcast.transcript) return "txt";
    return detectFormat(podcast.transcript);
  }, [podcast.transcript]);

  const hasCues = parsedCues.length > 0 && parsedCues.some((c) => c.startTime > 0 || c.endTime > 0);

  const dateLocale = language === "it" ? "it-IT" : "en-US";

  const handleCopyTranscript = useCallback(async () => {
    if (!podcast.transcript) return;
    try {
      await navigator.clipboard.writeText(podcast.transcript);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [podcast.transcript]);

  const handleDownloadTranscript = useCallback(
    (fmt: CaptionFormat) => {
      if (!podcast.transcript) return;
      let content: string;
      let extension: string;
      let mimeType: string;
      if (fmt === "srt") {
        content = parsedCues.length > 0 ? serializeToSRT(parsedCues) : podcast.transcript;
        extension = "srt";
        mimeType = "application/x-subrip";
      } else if (fmt === "vtt") {
        content = parsedCues.length > 0 ? serializeToVTT(parsedCues) : podcast.transcript;
        extension = "vtt";
        mimeType = "text/vtt";
      } else {
        content = parsedCues.length > 0 ? serializeToPlainText(parsedCues) : podcast.transcript;
        extension = "txt";
        mimeType = "text/plain";
      }
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${podcast.slug}-transcript.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      setShowDownloadMenu(false);
    },
    [podcast.transcript, podcast.slug, parsedCues]
  );

  return (
    <>
      <ScrollIndicator />

      {/* ── TED-style dark immersive hero ── */}
      <div className="ted-detail-hero">
        {/* Background cover blurred */}
        {podcast.coverImage && (
          <div className="ted-detail-hero-bg">
            <Image src={podcast.coverImage} alt="" fill className="object-cover" priority />
          </div>
        )}

        <div className="ted-detail-hero-content">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Breadcrumb */}
            <nav className="ted-breadcrumb">
              <Link href="/">{t.common.home}</Link>
              <ChevronIcon />
              <Link href="/podcasts">{t.podcasts.title}</Link>
              <ChevronIcon />
              <span>{podcast.title}</span>
            </nav>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* Cover */}
              <div className="ted-detail-cover">
                {podcast.coverImage ? (
                  <Image
                    src={podcast.coverImage}
                    alt={podcast.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-base-300/50 flex items-center justify-center">
                    <WaveIcon className="w-20 h-20 opacity-20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-2">
                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {podcast.categories?.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/podcasts?category=${cat.slug}`}
                      className="ted-detail-tag"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-white">
                  {podcast.title}
                </h1>

                <EditButton href={`/podcasts/edit/${podcast.slug}`} authorId={podcast.author.id} />

                {/* Author row */}
                <div className="flex items-center gap-4 mt-5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="ted-detail-avatar">
                      {podcast.author.image ? (
                        <Image
                          src={podcast.author.image}
                          alt=""
                          width={44}
                          height={44}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-white">
                          {podcast.author.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">
                        {podcast.author.name || t.common.anonymous}
                      </p>
                      <p className="text-xs text-white/50">
                        {new Date(podcast.createdAt).toLocaleDateString(dateLocale, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {podcast.duration && (
                    <div className="flex items-center gap-1.5 text-sm text-white/60">
                      <ClockIcon className="w-4 h-4" />
                      <span>{formatDuration(podcast.duration)}</span>
                    </div>
                  )}
                  {podcast.transcript && (
                    <div className="flex items-center gap-1.5 text-sm text-white/60">
                      <TranscriptIcon className="w-4 h-4" />
                      <span>{t.podcasts.transcriptBadge}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {podcast.tags && podcast.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {podcast.tags.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/podcasts?tag=${tag.slug}`}
                        className="ted-detail-hashtag"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Player section ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 ted-player-wrapper">
        <div className="ted-player-card">
          <WaveformPlayer src={podcast.audioUrl} />

          {/* Reactions & Share */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-base-content/8">
            <ReactionBar podcastId={podcast.id} />
            <ShareButtons
              title={podcast.title}
              url={
                typeof window !== "undefined" ? window.location.href : `/podcasts/${podcast.slug}`
              }
              description={podcast.description}
            />
          </div>
        </div>
      </div>

      {/* ── Content section ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Tabs */}
        {podcast.transcript ? (
          <div className="ted-tabs mb-8">
            <button
              onClick={() => setActiveTab("description")}
              className={`ted-tab ${activeTab === "description" ? "ted-tab-active" : ""}`}
            >
              <DescriptionIcon className="w-4 h-4" />
              {t.podcasts.description}
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`ted-tab ${activeTab === "transcript" ? "ted-tab-active" : ""}`}
            >
              <TranscriptIcon className="w-4 h-4" />
              {t.podcasts.transcript}
            </button>
          </div>
        ) : null}

        {/* Description panel */}
        {(activeTab === "description" || !podcast.transcript) && podcast.description && (
          <div className="ted-content-panel">
            <p className="text-base-content/75 whitespace-pre-wrap leading-relaxed text-lg">
              {podcast.description}
            </p>
          </div>
        )}

        {/* Transcript panel */}
        {activeTab === "transcript" && podcast.transcript && (
          <div className="ted-content-panel">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-base-content/8">
              <h3 className="font-bold flex items-center gap-2 text-base">
                <TranscriptIcon className="w-5 h-5 text-primary" />
                {t.podcasts.transcript}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyTranscript}
                  className="btn btn-ghost btn-xs gap-1"
                  title={t.podcasts.copyTranscript}
                >
                  {copySuccess ? (
                    <CheckIcon className="w-4 h-4 text-success" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {copySuccess ? t.podcasts.copied : t.podcasts.copyTranscript}
                  </span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="btn btn-ghost btn-xs gap-1"
                    title={t.podcasts.downloadTranscript}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.podcasts.downloadTranscript}</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute right-0 top-full mt-1 z-20 bg-base-100 shadow-xl border border-base-content/10 rounded-lg py-1 min-w-[120px]">
                      <button
                        onClick={() => handleDownloadTranscript("srt")}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-base-content/5 transition-colors"
                      >
                        SRT
                      </button>
                      <button
                        onClick={() => handleDownloadTranscript("vtt")}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-base-content/5 transition-colors"
                      >
                        WebVTT
                      </button>
                      <button
                        onClick={() => handleDownloadTranscript("txt")}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-base-content/5 transition-colors"
                      >
                        TXT
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setTranscriptOpen(!transcriptOpen)}
                  className="btn btn-ghost btn-xs gap-1"
                >
                  {transcriptOpen ? (
                    <CollapseIcon className="w-4 h-4" />
                  ) : (
                    <ExpandIcon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {transcriptOpen ? t.podcasts.collapseAll : t.podcasts.expandAll}
                  </span>
                </button>
              </div>
            </div>

            {/* Transcript body */}
            <div
              className={`ted-transcript-body ${transcriptOpen ? "ted-transcript-expanded" : ""}`}
            >
              {hasCues ? (
                <div className="space-y-1">
                  {parsedCues.map((cue) => (
                    <div
                      key={cue.id}
                      className="flex gap-3 py-1.5 group hover:bg-base-content/3 rounded px-2 -mx-2 transition-colors"
                    >
                      <span className="text-xs font-mono text-primary/70 pt-0.5 select-none shrink-0 min-w-[4rem] text-right">
                        {formatTimestampShort(cue.startTime)}
                      </span>
                      <p className="text-base-content/75 leading-relaxed flex-1">{cue.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-base-content/75">
                  {podcast.transcript}
                </p>
              )}
            </div>
            {!transcriptOpen && (
              <button onClick={() => setTranscriptOpen(true)} className="ted-show-more">
                {t.podcasts.showFullTranscript}
              </button>
            )}
          </div>
        )}

        {/* Author Bio */}
        {podcast.author.bio && (
          <div className="ted-author-card mt-10">
            <div className="flex items-start gap-5">
              <div className="ted-author-avatar">
                {podcast.author.image ? (
                  <Image
                    src={podcast.author.image}
                    alt=""
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold">
                    {podcast.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="ted-author-label">{t.podcasts.hostedBy}</p>
                <h4 className="font-bold text-xl mb-1">{podcast.author.name}</h4>
                <p className="text-base-content/55 text-sm leading-relaxed">{podcast.author.bio}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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

function ChevronIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 opacity-40"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DescriptionIcon({ className }: { className?: string }) {
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
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
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
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function CollapseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
