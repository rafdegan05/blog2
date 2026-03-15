"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/components/LanguageProvider";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll(); // check initial position
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const role = session?.user?.role;
  const canCreate = role === "AUTHOR" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  return (
    <div
      className={`navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-base-200/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="navbar-start">
        <div className="dropdown">
          <button
            className="btn btn-ghost lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.nav.openMenu}
            aria-expanded={menuOpen}
          >
            {/* Hamburger icon */}
            <svg
              className={`h-5 w-5 transition-all duration-300 ${menuOpen ? "hidden" : "block"}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
            {/* Close icon */}
            <svg
              className={`h-5 w-5 transition-all duration-300 ${menuOpen ? "block" : "hidden"}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {/* Backdrop overlay */}
          {menuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/20 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}
          {menuOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-56 p-2 shadow-xl border border-base-300"
            >
              <li>
                <Link
                  href="/"
                  onClick={closeMenu}
                  className={isActive("/") ? "active font-semibold" : ""}
                >
                  {t.common.home}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  onClick={closeMenu}
                  className={isActive("/blog") ? "active font-semibold" : ""}
                >
                  {t.nav.blog}
                </Link>
              </li>
              <li>
                <Link
                  href="/podcasts"
                  onClick={closeMenu}
                  className={isActive("/podcasts") ? "active font-semibold" : ""}
                >
                  {t.nav.podcast}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={closeMenu}
                  className={isActive("/about") ? "active font-semibold" : ""}
                >
                  {t.nav.about}
                </Link>
              </li>
              {session && (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      className={isActive("/dashboard") ? "active font-semibold" : ""}
                    >
                      {t.nav.dashboard}
                    </Link>
                  </li>
                  {canCreate && (
                    <>
                      <li>
                        <Link
                          href="/blog/new"
                          onClick={closeMenu}
                          className={isActive("/blog/new") ? "active font-semibold" : ""}
                        >
                          {t.nav.newPost}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/podcasts/new"
                          onClick={closeMenu}
                          className={isActive("/podcasts/new") ? "active font-semibold" : ""}
                        >
                          {t.nav.newPodcast}
                        </Link>
                      </li>
                    </>
                  )}
                  {isAdmin && (
                    <li>
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className={`text-accent ${isActive("/admin") ? "active font-semibold" : ""}`}
                      >
                        {t.nav.adminPanel}
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          )}
        </div>
        <Link href="/" className="btn btn-ghost text-xl font-bold gap-2">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">
            Slice of Life
          </span>
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li>
            <Link
              href="/"
              className={`btn btn-ghost btn-sm ${isActive("/") ? "btn-active text-primary" : ""}`}
            >
              {t.common.home}
            </Link>
          </li>
          <li>
            <Link
              href="/blog"
              className={`btn btn-ghost btn-sm ${isActive("/blog") ? "btn-active text-primary" : ""}`}
            >
              {t.nav.blog}
            </Link>
          </li>
          <li>
            <Link
              href="/podcasts"
              className={`btn btn-ghost btn-sm ${isActive("/podcasts") ? "btn-active text-primary" : ""}`}
            >
              {t.nav.podcast}
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className={`btn btn-ghost btn-sm ${isActive("/about") ? "btn-active text-primary" : ""}`}
            >
              {t.nav.about}
            </Link>
          </li>
          {session && (
            <>
              <li>
                <Link
                  href="/dashboard"
                  className={`btn btn-ghost btn-sm ${isActive("/dashboard") ? "btn-active text-primary" : ""}`}
                >
                  {t.nav.dashboard}
                </Link>
              </li>
              {canCreate && (
                <>
                  <li>
                    <Link
                      href="/blog/new"
                      className={`btn btn-ghost btn-sm ${isActive("/blog/new") ? "btn-active text-primary" : ""}`}
                    >
                      {t.nav.newPost}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/podcasts/new"
                      className={`btn btn-ghost btn-sm ${isActive("/podcasts/new") ? "btn-active text-primary" : ""}`}
                    >
                      {t.nav.newPodcast}
                    </Link>
                  </li>
                </>
              )}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    className={`btn btn-ghost btn-sm ${isActive("/admin") ? "btn-active text-accent" : "text-accent"}`}
                  >
                    {t.nav.admin}
                  </Link>
                </li>
              )}
            </>
          )}
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
        {session ? (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className={`btn btn-ghost btn-circle avatar ${!session.user?.image ? "placeholder" : ""}`}
              aria-label={t.nav.userMenu}
            >
              <div
                className={`w-10 rounded-full flex items-center justify-center ${!session.user?.image ? "bg-primary text-primary-content" : ""}`}
              >
                {session.user?.image ? (
                  <Image
                    alt="avatar"
                    src={session.user.image}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title">
                <span>{session.user?.name || session.user?.email}</span>
                {role && <span className="badge badge-xs badge-primary ml-2">{role}</span>}
              </li>
              <li>
                <Link href="/profile">{t.nav.profileSettings}</Link>
              </li>
              <li>
                <Link href={`/u/${session.user?.id}`}>{t.userProfile.about}</Link>
              </li>
              <li>
                <Link href="/dashboard">{t.nav.dashboard}</Link>
              </li>
              {isAdmin && (
                <>
                  <div className="divider my-1" />
                  <li>
                    <Link href="/admin" className="text-accent">
                      {t.nav.adminPanel}
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/users">{t.nav.manageUsers}</Link>
                  </li>
                  <li>
                    <Link href="/admin/moderation">{t.nav.moderation}</Link>
                  </li>
                </>
              )}
              <div className="divider my-1" />
              <li>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-error">
                  {t.common.signOut}
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <Link href="/auth/signin" className="btn btn-primary btn-sm">
            {t.common.signIn}
          </Link>
        )}
      </div>
    </div>
  );
}
