import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer bg-base-200 text-base-content p-10 mt-auto">
      <nav>
        <h6 className="footer-title">Content</h6>
        <Link href="/blog" className="link link-hover">
          Blog
        </Link>
        <Link href="/podcasts" className="link link-hover">
          Podcasts
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title">Account</h6>
        <Link href="/auth/signin" className="link link-hover">
          Sign In
        </Link>
        <Link href="/auth/register" className="link link-hover">
          Register
        </Link>
        <Link href="/dashboard" className="link link-hover">
          Dashboard
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title">Platform</h6>
        <Link href="/" className="link link-hover">
          Home
        </Link>
        <Link href="/sitemap.xml" className="link link-hover">
          Sitemap
        </Link>
      </nav>
      <aside className="col-span-full text-center">
        <p className="text-base-content/60">
          © {new Date().getFullYear()} Blog & Podcast — Built with Next.js, DaisyUI & Prisma
        </p>
      </aside>
    </footer>
  );
}
