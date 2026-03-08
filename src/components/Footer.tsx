"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer bg-base-200 text-base-content p-10 mt-auto">
      <nav>
        <h6 className="footer-title">{t.footer.content}</h6>
        <Link href="/blog" className="link link-hover">
          {t.footer.blog}
        </Link>
        <Link href="/podcasts" className="link link-hover">
          {t.footer.podcasts}
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title">{t.footer.account}</h6>
        <Link href="/auth/signin" className="link link-hover">
          {t.common.signIn}
        </Link>
        <Link href="/auth/register" className="link link-hover">
          {t.footer.register}
        </Link>
        <Link href="/dashboard" className="link link-hover">
          {t.nav.dashboard}
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title">{t.footer.platform}</h6>
        <Link href="/" className="link link-hover">
          {t.common.home}
        </Link>
        <Link href="/about" className="link link-hover">
          {t.nav.about}
        </Link>
        <Link href="/sitemap.xml" className="link link-hover">
          {t.footer.sitemap}
        </Link>
      </nav>
      <aside className="col-span-full text-center">
        <p className="text-base-content/60">{t.footer.copyright.replace("{year}", String(year))}</p>
      </aside>
    </footer>
  );
}
