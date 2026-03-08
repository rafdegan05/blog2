"use client";

import Link from "next/link";
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

export default function HomeContent({
  posts,
  podcasts,
}: {
  posts: PostSummary[];
  podcasts: PodcastSummary[];
}) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero min-h-[70vh] bg-gradient-to-br from-base-200 to-base-300 relative overflow-hidden -mt-16 pt-16">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>
        {/* Decorative blurred circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="hero-content text-center py-20 relative z-10">
          <div className="max-w-3xl">
            <p className="text-sm tracking-widest uppercase text-primary/80 mb-4 font-medium">
              {t.home.badge}
            </p>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              {t.home.heroTitle}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t.home.heroHighlight}
              </span>
            </h1>
            <p className="py-6 text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto">
              {t.home.heroText}
            </p>
            <p className="text-sm italic text-base-content/50 mb-8">{t.home.heroSubtext}</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/blog" className="btn btn-primary btn-lg gap-2">
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
          </div>
        </div>
      </section>

      {/* Pillars Section — Reflection, Documentation, Growth */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t.home.pillarsTitle}</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reflection */}
            <div className="card bg-base-200/50 border border-base-300 hover:border-primary/30 transition-all hover:-translate-y-1">
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
            <div className="card bg-base-200/50 border border-base-300 hover:border-secondary/30 transition-all hover:-translate-y-1">
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
            <div className="card bg-base-200/50 border border-base-300 hover:border-accent/30 transition-all hover:-translate-y-1">
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

      {/* Latest Posts Section */}
      {posts.length > 0 && (
        <section className="py-16 px-4 bg-gradient-to-br from-base-200 to-base-300">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
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
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="card bg-base-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300/50"
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

      {/* Latest Podcasts Section */}
      {podcasts.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
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
              {podcasts.map((podcast) => (
                <Link
                  key={podcast.slug}
                  href={`/podcasts/${podcast.slug}`}
                  className="card bg-base-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300/50"
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

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-base-200 to-base-300">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t.home.ctaTitle}</h2>
          <p className="text-base-content/60 mb-8 text-lg">{t.home.ctaText}</p>
          <Link href="/blog" className="btn btn-primary btn-lg">
            {t.home.getStarted}
          </Link>
        </div>
      </section>
    </div>
  );
}
