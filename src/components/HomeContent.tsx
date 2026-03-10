"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/components/LanguageProvider";
import PostCard from "@/components/PostCard";
import PodcastCard from "@/components/PodcastCard";

/* ── Interfaces ── */

interface PostSummary {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  createdAt: string;
  author: { name?: string | null; image?: string | null };
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  _count?: { comments: number };
  readingTime?: number;
}

interface PodcastSummary {
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
}

/** Intersection-Observer hook: adds `.revealed` when elements enter viewport */
function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId = requestAnimationFrame(() => {
      const targets = el.querySelectorAll(".reveal, .reveal-scale");
      if (targets.length === 0) return;

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
      );
      targets.forEach((t) => io.observe(t));

      rafId = 0 as unknown as number;
      el.dataset.ioCleanup = "true";
      const origCleanup = () => io.disconnect();
      (el as unknown as Record<string, () => void>).__ioCleanup = origCleanup;
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      const cleanup = (el as unknown as Record<string, (() => void) | undefined>).__ioCleanup;
      if (cleanup) cleanup();
    };
  }, []);

  return containerRef;
}

export default function HomeContent({
  posts,
  podcasts,
}: {
  posts: PostSummary[];
  podcasts: PodcastSummary[];
}) {
  const { t } = useTranslation();
  const wrapperRef = useScrollReveal();

  return (
    <div ref={wrapperRef}>
      {/* ════════════════════════════════════════════════
          Hero Section — full-viewport, immersive
         ════════════════════════════════════════════════ */}
      <section className="home-hero">
        {/* Ambient background shapes */}
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* Ambient background shapes */}
        <div className="home-hero-bg">
          <div className="home-hero-blob home-hero-blob--primary" />
          <div className="home-hero-blob home-hero-blob--secondary" />
          <div className="home-hero-blob home-hero-blob--accent" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto text-center px-4 py-20">
          {/* Badge */}
          <p className="reveal text-sm tracking-[0.2em] uppercase text-primary/80 mb-6 font-medium">
            {t.home.badge}
          </p>

          {/* Main heading */}
          <h1 className="reveal reveal-delay-1 text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.08] mb-6">
            {t.home.heroTitle}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_6s_ease-in-out_infinite]">
              {t.home.heroHighlight}
            </span>
          </h1>

          {/* Personal intro */}
          <p className="reveal reveal-delay-2 text-lg md:text-xl text-base-content/65 max-w-2xl mx-auto leading-relaxed mb-2">
            {t.home.heroText}
          </p>
          <p className="reveal reveal-delay-3 text-sm italic text-base-content/40 mb-10">
            {t.home.heroSubtext}
          </p>

          {/* Scroll cue */}
          <div className="reveal reveal-delay-4 mt-16">
            <div className="home-scroll-cue">
              <div className="home-scroll-cue-dot" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          Latest Posts — reuses PostCard
         ════════════════════════════════════════════════ */}
      {posts.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-br from-base-200 to-base-300">
          <div className="max-w-6xl mx-auto">
            <div className="reveal flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold">{t.home.latestArticles}</h2>
                <p className="text-base-content/50 text-sm mt-1">
                  {t.blog.articlesPlural.replace("{n}", String(posts.length))}
                </p>
              </div>
              <Link href="/blog" className="btn btn-ghost btn-sm gap-1 shrink-0">
                {t.home.viewAll}
                <ChevronRightIcon />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <div key={post.slug} className={`reveal-scale reveal-delay-${Math.min(i + 1, 3)}`}>
                  <PostCard post={post} featured={i === 0 && posts.length >= 3} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          Latest Podcasts — reuses PodcastCard
         ════════════════════════════════════════════════ */}
      {podcasts.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-br from-base-200 to-base-300">
          <div className="max-w-6xl mx-auto">
            <div className="reveal flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold">{t.home.latestEpisodes}</h2>
                <p className="text-base-content/50 text-sm mt-1">
                  {t.podcasts.episodesPlural.replace("{n}", String(podcasts.length))}
                </p>
              </div>
              <Link href="/podcasts" className="btn btn-ghost btn-sm gap-1 shrink-0">
                {t.home.viewAll}
                <ChevronRightIcon />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((podcast, i) => (
                <div
                  key={podcast.slug}
                  className={`reveal-scale reveal-delay-${Math.min(i + 1, 3)}`}
                >
                  <PodcastCard podcast={podcast} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   Icons (inline SVG, tree-shakeable)
   ══════════════════════════════════════ */

function BookIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}
