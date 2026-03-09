"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/components/LanguageProvider";

interface PostSummary {
  slug: string;
  title: string;
  excerpt?: string;
  createdAt: string;
  author: { name?: string };
}

interface PodcastSummary {
  slug: string;
  title: string;
  description?: string;
  createdAt: string;
  author: { name?: string };
  duration?: number;
}

/** Intersection-Observer hook: adds `.revealed` when elements enter viewport */
function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Wait one frame so the browser has painted before we start observing.
    // This ensures elements already in the viewport get their entrance animation.
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

      // Store cleanup
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
      {/* ── Hero Section ── */}
      <section className="min-h-[80vh] bg-gradient-to-br from-base-200 via-base-100 to-base-200 relative overflow-hidden -mt-16 pt-16 flex items-center">
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
        {/* Decorative blurred shapes */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full text-center py-20 px-4 relative z-10 max-w-3xl mx-auto">
          {/* Greeting */}
          <p className="reveal text-sm tracking-[0.2em] uppercase text-primary/80 mb-6 font-medium">
            {t.home.badge}
          </p>

          {/* Main heading */}
          <h1 className="reveal reveal-delay-1 text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6">
            {t.home.heroTitle}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t.home.heroHighlight}
            </span>
          </h1>

          {/* Personal intro */}
          <p className="reveal reveal-delay-2 text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed mb-2">
            {t.home.heroText}
          </p>
          <p className="reveal reveal-delay-3 text-sm italic text-base-content/50 mb-10">
            {t.home.heroSubtext}
          </p>

          {/* CTAs */}
          <div className="reveal reveal-delay-4 flex gap-4 justify-center flex-wrap">
            <Link href="/blog" className="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {t.home.readBlog}
            </Link>
            <Link href="/podcasts" className="btn btn-outline btn-lg gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              {t.home.listenPodcasts}
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="reveal reveal-delay-4 mt-16 animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mx-auto text-base-content/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ── Pillars Section ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="reveal text-3xl font-bold text-center mb-4">{t.home.pillarsTitle}</h2>
          <div className="reveal reveal-delay-1 w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-14" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reflection */}
            <div className="reveal-scale reveal-delay-1 card bg-base-200/50 border border-base-300 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="card-body">
                <div className="bg-primary/10 rounded-xl p-3 w-fit mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-xl">{t.home.pillarReflection}</h3>
                <p className="text-base-content/60 leading-relaxed">
                  {t.home.pillarReflectionDesc}
                </p>
              </div>
            </div>
            {/* Documentation */}
            <div className="reveal-scale reveal-delay-2 card bg-base-200/50 border border-base-300 hover:border-secondary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="card-body">
                <div className="bg-secondary/10 rounded-xl p-3 w-fit mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-xl">{t.home.pillarDocumentation}</h3>
                <p className="text-base-content/60 leading-relaxed">
                  {t.home.pillarDocumentationDesc}
                </p>
              </div>
            </div>
            {/* Growth */}
            <div className="reveal-scale reveal-delay-3 card bg-base-200/50 border border-base-300 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="card-body">
                <div className="bg-accent/10 rounded-xl p-3 w-fit mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-xl">{t.home.pillarGrowth}</h3>
                <p className="text-base-content/60 leading-relaxed">{t.home.pillarGrowthDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest Posts ── */}
      {posts.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-br from-base-200 to-base-300">
          <div className="max-w-6xl mx-auto">
            <div className="reveal flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">{t.home.latestArticles}</h2>
              <Link href="/blog" className="btn btn-ghost btn-sm gap-1">
                {t.home.viewAll}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={`reveal-scale reveal-delay-${Math.min(i + 1, 3)} card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-base-300/50`}
                >
                  <div className="card-body">
                    <h3 className="card-title text-lg">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-base-content/60 text-sm line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-base-content/50 mt-2">
                      <span>{post.author?.name || t.common.anonymous}</span>
                      <span>·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Podcasts ── */}
      {podcasts.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="reveal flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">{t.home.latestEpisodes}</h2>
              <Link href="/podcasts" className="btn btn-ghost btn-sm gap-1">
                {t.home.viewAll}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((podcast, i) => (
                <Link
                  key={podcast.slug}
                  href={`/podcasts/${podcast.slug}`}
                  className={`reveal-scale reveal-delay-${Math.min(i + 1, 3)} card bg-base-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-base-300/50`}
                >
                  <div className="card-body">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-secondary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      </div>
                      <h3 className="card-title text-lg flex-1">{podcast.title}</h3>
                    </div>
                    {podcast.description && (
                      <p className="text-base-content/60 text-sm line-clamp-2">
                        {podcast.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-base-content/50 mt-2">
                      <span>{podcast.author?.name || t.common.anonymous}</span>
                      <span>·</span>
                      <span>{new Date(podcast.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Section ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-base-200 to-base-300">
        <div className="reveal max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t.home.ctaTitle}</h2>
          <p className="text-base-content/60 mb-8 text-lg leading-relaxed">{t.home.ctaText}</p>
          <Link href="/blog" className="btn btn-primary btn-lg shadow-lg shadow-primary/20">
            {t.home.getStarted}
          </Link>
        </div>
      </section>
    </div>
  );
}
