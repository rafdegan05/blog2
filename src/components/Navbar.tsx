"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="navbar bg-base-200 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
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
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/podcasts">Podcast</Link>
              </li>
              {session && (
                <>
                  <li>
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/blog/new">New Post</Link>
                  </li>
                  <li>
                    <Link href="/podcasts/new">New Podcast</Link>
                  </li>
                </>
              )}
            </ul>
          )}
        </div>
        <Link href="/" className="btn btn-ghost text-xl font-bold">
          📝 Blog & Podcast
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li>
            <Link href="/" className="btn btn-ghost btn-sm">
              Home
            </Link>
          </li>
          <li>
            <Link href="/blog" className="btn btn-ghost btn-sm">
              Blog
            </Link>
          </li>
          <li>
            <Link href="/podcasts" className="btn btn-ghost btn-sm">
              Podcast
            </Link>
          </li>
          {session && (
            <>
              <li>
                <Link href="/dashboard" className="btn btn-ghost btn-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/blog/new" className="btn btn-ghost btn-sm">
                  New Post
                </Link>
              </li>
              <li>
                <Link href="/podcasts/new" className="btn btn-ghost btn-sm">
                  New Podcast
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <ThemeSwitcher />
        {session ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                {session.user?.image ? (
                  <Image
                    alt="avatar"
                    src={session.user.image}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-lg font-bold rounded-full">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title">{session.user?.name || session.user?.email}</li>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li>
                <button onClick={() => signOut()}>Sign Out</button>
              </li>
            </ul>
          </div>
        ) : (
          <Link href="/auth/signin" className="btn btn-primary btn-sm">
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
