import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer footer-center bg-base-200 text-base-content p-10 mt-auto">
      <nav className="grid grid-flow-col gap-4">
        <Link href="/blog" className="link link-hover">
          Blog
        </Link>
        <Link href="/podcasts" className="link link-hover">
          Podcast
        </Link>
        <Link href="/auth/signin" className="link link-hover">
          Sign In
        </Link>
      </nav>
      <aside>
        <p>© {new Date().getFullYear()} Blog & Podcast — Built with Next.js, DaisyUI & Prisma</p>
      </aside>
    </footer>
  );
}
