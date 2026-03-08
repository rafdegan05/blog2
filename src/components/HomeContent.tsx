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
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t.home.heroHighlight}
              </span>
            </h1>
            <p className="py-6 text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto">
              {t.home.heroText}
            </p>
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                {t.home.readBlog}
              </Link>
              <Link href="/podcasts" className="btn btn-secondary btn-lg gap-2">
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
                  className="card bg-base-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
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
                  className="card bg-base-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
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
    </div>
  );
}
