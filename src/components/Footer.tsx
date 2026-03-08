"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-base-200 text-base-content mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand column */}
        <div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight mb-3 inline-block">
            Slice of Life
          </span>
          <p className="text-sm text-base-content/60 max-w-xs">{t.home.heroText}</p>
        </div>
        {/* Content links */}
        <div>
          <h6 className="footer-title">{t.footer.content}</h6>
          <ul className="space-y-2 mt-2">
            <li>
              <Link href="/blog" className="link link-hover text-sm">
                {t.footer.blog}
              </Link>
            </li>
            <li>
              <Link href="/podcasts" className="link link-hover text-sm">
                {t.footer.podcasts}
              </Link>
            </li>
            <li>
              <Link href="/about" className="link link-hover text-sm">
                {t.nav.about}
              </Link>
            </li>
          </ul>
        </div>
        {/* Account links */}
        <div>
          <h6 className="footer-title">{t.footer.account}</h6>
          <ul className="space-y-2 mt-2">
            <li>
              <Link href="/auth/signin" className="link link-hover text-sm">
                {t.common.signIn}
              </Link>
            </li>
            <li>
              <Link href="/auth/register" className="link link-hover text-sm">
                {t.footer.register}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="link link-hover text-sm">
                {t.nav.dashboard}
              </Link>
            </li>
          </ul>
        </div>
        {/* Platform links */}
        <div>
          <h6 className="footer-title">{t.footer.platform}</h6>
          <ul className="space-y-2 mt-2">
            <li>
              <Link href="/" className="link link-hover text-sm">
                {t.common.home}
              </Link>
            </li>
            <li>
              <Link href="/sitemap.xml" className="link link-hover text-sm">
                {t.footer.sitemap}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-base-300">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-base-content/60">
          {t.footer.copyright.replace("{year}", String(year))}
        </div>
      </div>
    </footer>
  );
}
