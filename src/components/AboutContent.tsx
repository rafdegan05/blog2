"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function AboutContent() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <section className="text-center mb-16">
        <span className="badge badge-primary badge-lg mb-4">{t.about.badge}</span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          {t.about.title}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.about.titleHighlight}
          </span>
        </h1>
        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">{t.about.intro}</p>
      </section>

      {/* Mission */}
      <section className="mb-16">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {t.about.missionTitle}
            </h2>
            <p className="text-base-content/80 leading-relaxed">{t.about.missionText}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t.about.offerTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="card-title text-lg">{t.about.offerBlog}</h3>
              <p className="text-base-content/60 text-sm">{t.about.offerBlogDesc}</p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body items-center text-center">
              <div className="bg-secondary/10 rounded-full p-4 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-secondary"
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
              <h3 className="card-title text-lg">{t.about.offerPodcast}</h3>
              <p className="text-base-content/60 text-sm">{t.about.offerPodcastDesc}</p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body items-center text-center">
              <div className="bg-accent/10 rounded-full p-4 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="card-title text-lg">{t.about.offerCommunity}</h3>
              <p className="text-base-content/60 text-sm">{t.about.offerCommunityDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t.about.builtWith}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Next.js",
            "React",
            "TypeScript",
            "Tailwind CSS",
            "DaisyUI",
            "Prisma",
            "PostgreSQL",
            "NextAuth.js",
            "Docker",
          ].map((tech) => (
            <span key={tech} className="badge badge-outline badge-lg py-3 px-5 text-sm">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="card-body items-center py-12">
            <h2 className="text-2xl font-bold mb-2">{t.about.ctaTitle}</h2>
            <p className="text-base-content/60 mb-6 max-w-md">{t.about.ctaText}</p>
            <div className="flex gap-4">
              <Link href="/auth/register" className="btn btn-primary">
                {t.about.createAccount}
              </Link>
              <Link href="/blog" className="btn btn-ghost">
                {t.about.exploreBlog}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
