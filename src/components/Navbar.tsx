"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/components/LanguageProvider";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  const role = session?.user?.role;
  const canCreate = role === "AUTHOR" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  return (
    <div className="navbar bg-base-200 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.nav.openMenu}
          >
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
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          {menuOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow"
              onClick={() => setMenuOpen(false)}
            >
              <li>
                <Link href="/">{t.common.home}</Link>
              </li>
              <li>
                <Link href="/blog">{t.nav.blog}</Link>
              </li>
              <li>
                <Link href="/podcasts">{t.nav.podcast}</Link>
              </li>
              <li>
                <Link href="/about">{t.nav.about}</Link>
              </li>
              {session && (
                <>
                  <li>
                    <Link href="/dashboard">{t.nav.dashboard}</Link>
                  </li>
                  {canCreate && (
                    <>
                      <li>
                        <Link href="/blog/new">{t.nav.newPost}</Link>
                      </li>
                      <li>
                        <Link href="/podcasts/new">{t.nav.newPodcast}</Link>
                      </li>
                    </>
                  )}
                  {isAdmin && (
                    <li>
                      <Link href="/admin" className="text-accent">
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
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <span className="hidden sm:inline">{t.common.brandName}</span>
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li>
            <Link href="/" className="btn btn-ghost btn-sm">
              {t.common.home}
            </Link>
          </li>
          <li>
            <Link href="/blog" className="btn btn-ghost btn-sm">
              {t.nav.blog}
            </Link>
          </li>
          <li>
            <Link href="/podcasts" className="btn btn-ghost btn-sm">
              {t.nav.podcast}
            </Link>
          </li>
          <li>
            <Link href="/about" className="btn btn-ghost btn-sm">
              {t.nav.about}
            </Link>
          </li>
          {session && (
            <>
              <li>
                <Link href="/dashboard" className="btn btn-ghost btn-sm">
                  {t.nav.dashboard}
                </Link>
              </li>
              {canCreate && (
                <>
                  <li>
                    <Link href="/blog/new" className="btn btn-ghost btn-sm">
                      {t.nav.newPost}
                    </Link>
                  </li>
                  <li>
                    <Link href="/podcasts/new" className="btn btn-ghost btn-sm">
                      {t.nav.newPodcast}
                    </Link>
                  </li>
                </>
              )}
              {isAdmin && (
                <li>
                  <Link href="/admin" className="btn btn-ghost btn-sm text-accent">
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
