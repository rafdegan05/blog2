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
        <p className="text-lg text-base-content/70 max-w-2xl mx-auto leading-relaxed">
          {t.about.intro}
        </p>
      </section>

      {/* Why This Exists */}
      <section className="mb-16">
        <div className="card bg-base-200/60 border border-base-300 shadow-lg">
          <div className="card-body md:p-10">
            <h2 className="card-title text-2xl mb-4 gap-3">
              <div className="bg-primary/10 rounded-xl p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
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
              </div>
              {t.about.missionTitle}
            </h2>
            <p className="text-base-content/70 leading-relaxed text-lg">{t.about.missionText}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-4">{t.about.valuesTitle}</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Curiosity */}
          <div className="card bg-base-200/50 border border-base-300 hover:border-primary/30 transition-all">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 rounded-xl p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-lg">{t.about.valueCuriosity}</h3>
              </div>
              <p className="text-base-content/60 leading-relaxed">{t.about.valueCuriosityDesc}</p>
            </div>
          </div>

          {/* Clarity */}
          <div className="card bg-base-200/50 border border-base-300 hover:border-secondary/30 transition-all">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-secondary/10 rounded-xl p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-lg">{t.about.valueClarity}</h3>
              </div>
              <p className="text-base-content/60 leading-relaxed">{t.about.valueClarityDesc}</p>
            </div>
          </div>

          {/* Honesty */}
          <div className="card bg-base-200/50 border border-base-300 hover:border-accent/30 transition-all">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-accent/10 rounded-xl p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-lg">{t.about.valueHonesty}</h3>
              </div>
              <p className="text-base-content/60 leading-relaxed">{t.about.valueHonestyDesc}</p>
            </div>
          </div>

          {/* Consistency */}
          <div className="card bg-base-200/50 border border-base-300 hover:border-info/30 transition-all">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-info/10 rounded-xl p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-info"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-lg">{t.about.valueConsistency}</h3>
              </div>
              <p className="text-base-content/60 leading-relaxed">{t.about.valueConsistencyDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Find Here */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-4">{t.about.offerTitle}</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all">
            <div className="card-body items-center text-center">
              <div className="bg-primary/10 rounded-xl p-4 mb-3">
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
              <p className="text-base-content/60 text-sm leading-relaxed">
                {t.about.offerBlogDesc}
              </p>
            </div>
          </div>

          <div className="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all">
            <div className="card-body items-center text-center">
              <div className="bg-secondary/10 rounded-xl p-4 mb-3">
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
              <p className="text-base-content/60 text-sm leading-relaxed">
                {t.about.offerPodcastDesc}
              </p>
            </div>
          </div>

          <div className="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all">
            <div className="card-body items-center text-center">
              <div className="bg-accent/10 rounded-xl p-4 mb-3">
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="card-title text-lg">{t.about.offerCommunity}</h3>
              <p className="text-base-content/60 text-sm leading-relaxed">
                {t.about.offerCommunityDesc}
              </p>
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
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border border-base-300">
          <div className="card-body items-center py-12">
            <h2 className="text-2xl font-bold mb-2">{t.about.ctaTitle}</h2>
            <p className="text-base-content/60 mb-6 max-w-md leading-relaxed">{t.about.ctaText}</p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/auth/register" className="btn btn-primary">
                {t.about.createAccount}
              </Link>
              <Link href="/blog" className="btn btn-outline">
                {t.about.exploreBlog}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
