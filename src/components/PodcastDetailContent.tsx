"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import EditButton from "@/components/EditButton";
import ReactionBar from "@/components/ReactionBar";
import ShareButtons from "@/components/ShareButtons";
import ScrollIndicator from "@/components/ScrollIndicator";
import WaveformPlayer, { type WaveformPlayerHandle } from "@/components/WaveformPlayer";
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
  WHISPER_LANGUAGES,
  type CaptionCue,
  type CaptionFormat,
} from "@/lib/captions";

interface PodcastTranscript {
  language: string;
  content: string;
}

interface PodcastDetailContentProps {
  podcast: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    audioUrl: string;
    coverImage?: string;
    duration?: number;
    transcripts?: PodcastTranscript[];
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

  const hasTranscripts = podcast.transcripts && podcast.transcripts.length > 0;
  const availableLangs = useMemo(
    () => (podcast.transcripts || []).map((tr) => tr.language),
    [podcast.transcripts]
  );
  const [selectedTranscriptLang, setSelectedTranscriptLang] = useState<string>(
    availableLangs[0] || "en"
  );

  const activeTranscript = useMemo(
    () =>
      (podcast.transcripts || []).find((tr) => tr.language === selectedTranscriptLang)?.content ||
      null,
    [podcast.transcripts, selectedTranscriptLang]
  );

  const parsedCues = useMemo<CaptionCue[]>(() => {
    if (!activeTranscript) return [];
    const { cues } = parseCaptions(activeTranscript);
    return cues;
  }, [activeTranscript]);

  const detectedFormat = useMemo<CaptionFormat>(() => {
    if (!activeTranscript) return "txt";
    return detectFormat(activeTranscript);
  }, [activeTranscript]);

  const hasCues = parsedCues.length > 0 && parsedCues.some((c) => c.startTime > 0 || c.endTime > 0);

  const playerRef = useRef<WaveformPlayerHandle>(null);

  const handleTimestampClick = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    document
      .querySelector(".sp-player-card")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const dateLocale = language === "it" ? "it-IT" : "en-US";

  const handleCopyTranscript = useCallback(async () => {
    if (!activeTranscript) return;
    try {
      await navigator.clipboard.writeText(activeTranscript);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [activeTranscript]);

  const handleDownloadTranscript = useCallback(
    (fmt: CaptionFormat) => {
      if (!activeTranscript) return;
      let content: string;
      let extension: string;
      let mimeType: string;
      if (fmt === "srt") {
        content = parsedCues.length > 0 ? serializeToSRT(parsedCues) : activeTranscript;
        extension = "srt";
        mimeType = "application/x-subrip";
      } else if (fmt === "vtt") {
        content = parsedCues.length > 0 ? serializeToVTT(parsedCues) : activeTranscript;
        extension = "vtt";
        mimeType = "text/vtt";
      } else {
        content = parsedCues.length > 0 ? serializeToPlainText(parsedCues) : activeTranscript;
        extension = "txt";
        mimeType = "text/plain";
      }
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${podcast.slug}-${selectedTranscriptLang}-transcript.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      setShowDownloadMenu(false);
    },
    [activeTranscript, podcast.slug, parsedCues, selectedTranscriptLang]
  );

  return (
    <>
      <ScrollIndicator />

      {/* ── Spotify-style hero with gradient ── */}
      <div className="sp-hero">
        {/* Blurred background from cover */}
        {podcast.coverImage && (
          <div className="sp-hero-bg">
            <Image src={podcast.coverImage} alt="" fill className="object-cover" priority />
          </div>
        )}
        <div className="sp-hero-gradient" />

        <div className="sp-hero-content">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="sp-breadcrumb">
              <Link href="/">{t.common.home}</Link>
              <ChevronIcon />
              <Link href="/podcasts">{t.podcasts.title}</Link>
              <ChevronIcon />
              <span>{podcast.title}</span>
            </nav>

            <div className="sp-hero-layout">
              {/* Cover art with shadow */}
              <div className="sp-cover">
                {podcast.coverImage ? (
                  <Image
                    src={podcast.coverImage}
                    alt={podcast.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="sp-cover-placeholder">
                    <WaveIcon className="w-16 h-16 opacity-30" />
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="sp-meta">
                <span className="sp-type-label">
                  {language === "it" ? "Episodio podcast" : "Podcast Episode"}
                </span>

                <h1 className="sp-title">{podcast.title}</h1>

                {/* Author + date row */}
                <div className="sp-author-row">
                  <div className="sp-avatar">
                    {podcast.author.image ? (
                      <Image
                        src={podcast.author.image}
                        alt=""
                        width={28}
                        height={28}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {podcast.author.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <span className="sp-author-name">
                    {podcast.author.name || t.common.anonymous}
                  </span>
                  <span className="sp-dot">·</span>
                  <span className="sp-date">
                    {new Date(podcast.createdAt).toLocaleDateString(dateLocale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {podcast.duration && (
                    <>
                      <span className="sp-dot">·</span>
                      <span className="sp-date">{formatDuration(podcast.duration)}</span>
                    </>
                  )}
                </div>

                {/* Categories as chips */}
                {podcast.categories && podcast.categories.length > 0 && (
                  <div className="sp-chips">
                    {podcast.categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/podcasts?category=${cat.slug}`}
                        className="sp-chip"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action bar (Spotify-style play + actions row) ── */}
      <div className="sp-action-bar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sp-actions-row">
            <div className="sp-actions-left">
              <EditButton href={`/podcasts/edit/${podcast.slug}`} authorId={podcast.author.id} />
              {hasTranscripts && (
                <div className="sp-badge">
                  <TranscriptIcon className="w-3.5 h-3.5" />
                  <span>{t.podcasts.transcriptBadge}</span>
                </div>
              )}
            </div>
            <div className="sp-actions-right">
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
      </div>

      {/* ── Player card ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sp-player-card">
          <WaveformPlayer ref={playerRef} src={podcast.audioUrl} />
        </div>
      </div>

      {/* ── Tags row ── */}
      {podcast.tags && podcast.tags.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="sp-tags">
            {podcast.tags.map((tag) => (
              <Link key={tag.slug} href={`/podcasts?tag=${tag.slug}`} className="sp-tag">
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Content section ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 sp-content-section">
        {/* Tabs */}
        {hasTranscripts ? (
          <div className="sp-tabs">
            <button
              onClick={() => setActiveTab("description")}
              className={`sp-tab ${activeTab === "description" ? "sp-tab--active" : ""}`}
            >
              {t.podcasts.description}
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`sp-tab ${activeTab === "transcript" ? "sp-tab--active" : ""}`}
            >
              {t.podcasts.transcript}
            </button>
          </div>
        ) : null}

        {/* Description panel */}
        {(activeTab === "description" || !hasTranscripts) && podcast.description && (
          <div className="sp-panel">
            <p className="sp-description-text">{podcast.description}</p>
          </div>
        )}

        {/* Transcript panel */}
        {activeTab === "transcript" && hasTranscripts && (
          <div className="sp-panel">
            {/* Language selector (only if multiple transcripts) */}
            {availableLangs.length > 1 && (
              <div className="sp-transcript-lang-selector">
                {availableLangs.map((lang) => {
                  const langInfo = WHISPER_LANGUAGES.find((l) => l.code === lang);
                  const label = langInfo
                    ? language === "it"
                      ? langInfo.labelIt
                      : langInfo.label
                    : lang.toUpperCase();
                  return (
                    <button
                      key={lang}
                      onClick={() => setSelectedTranscriptLang(lang)}
                      className={`sp-transcript-lang-btn ${selectedTranscriptLang === lang ? "sp-transcript-lang-btn--active" : ""}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Toolbar */}
            <div className="sp-transcript-toolbar">
              <h3 className="sp-transcript-title">
                <TranscriptIcon className="w-5 h-5" />
                {t.podcasts.transcript}
              </h3>
              <div className="sp-transcript-actions">
                <button
                  onClick={handleCopyTranscript}
                  className="sp-icon-btn"
                  title={t.podcasts.copyTranscript}
                >
                  {copySuccess ? (
                    <CheckIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline text-xs">
                    {copySuccess ? t.podcasts.copied : t.podcasts.copyTranscript}
                  </span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="sp-icon-btn"
                    title={t.podcasts.downloadTranscript}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">
                      {t.podcasts.downloadTranscript}
                    </span>
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                  {showDownloadMenu && (
                    <div className="sp-dropdown">
                      <button
                        onClick={() => handleDownloadTranscript("srt")}
                        className="sp-dropdown-item"
                      >
                        SRT
                      </button>
                      <button
                        onClick={() => handleDownloadTranscript("vtt")}
                        className="sp-dropdown-item"
                      >
                        WebVTT
                      </button>
                      <button
                        onClick={() => handleDownloadTranscript("txt")}
                        className="sp-dropdown-item"
                      >
                        TXT
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setTranscriptOpen(!transcriptOpen)} className="sp-icon-btn">
                  {transcriptOpen ? (
                    <CollapseIcon className="w-4 h-4" />
                  ) : (
                    <ExpandIcon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline text-xs">
                    {transcriptOpen ? t.podcasts.collapseAll : t.podcasts.expandAll}
                  </span>
                </button>
              </div>
            </div>

            {/* Transcript body */}
            <div className={`sp-transcript-body ${transcriptOpen ? "sp-transcript-expanded" : ""}`}>
              {hasCues ? (
                <div className="sp-cue-list">
                  {parsedCues.map((cue) => (
                    <div key={cue.id} className="sp-cue">
                      <button
                        type="button"
                        onClick={() => handleTimestampClick(cue.startTime)}
                        className="sp-cue-time"
                        title={
                          language === "it" ? "Riproduci da questo punto" : "Play from this point"
                        }
                      >
                        <PlaySmallIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        {formatTimestampShort(cue.startTime)}
                      </button>
                      <p className="sp-cue-text">{cue.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sp-plain-transcript">{activeTranscript}</p>
              )}
            </div>
            {!transcriptOpen && (
              <button onClick={() => setTranscriptOpen(true)} className="sp-show-more">
                {t.podcasts.showFullTranscript}
              </button>
            )}
          </div>
        )}

        {/* Author Bio */}
        {podcast.author.bio && (
          <div className="sp-author-card">
            <div className="sp-author-inner">
              <div className="sp-author-avatar-lg">
                {podcast.author.image ? (
                  <Image
                    src={podcast.author.image}
                    alt=""
                    width={72}
                    height={72}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {podcast.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="sp-author-label">{t.podcasts.hostedBy}</p>
                <h4 className="sp-author-name-lg">{podcast.author.name}</h4>
                <p className="sp-author-bio">{podcast.author.bio}</p>
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
      className="w-3 h-3 opacity-40"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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

function PlaySmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l9-5.5z" />
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
