import Link from "next/link";

async function getLatestPosts() {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/posts?limit=3`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}

async function getLatestPodcasts() {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/podcasts?limit=3`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.podcasts || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [posts, podcasts] = await Promise.all([getLatestPosts(), getLatestPodcasts()]);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero min-h-[70vh] bg-gradient-to-br from-base-200 to-base-300">
        <div className="hero-content text-center py-20">
          <div className="max-w-3xl">
            <div className="mb-6">
              <span className="badge badge-primary badge-lg gap-2 mb-4">Open Source Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              Share Ideas Through{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Blog & Podcast
              </span>
            </h1>
            <p className="py-6 text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto">
              Discover insightful articles and engaging podcasts on technology, development, and
              more. Share your thoughts and connect with the community.
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
                Read Blog
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
                Listen Podcasts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-base-content/60 max-w-2xl mx-auto">
              A full-featured platform for creating, sharing, and discovering content.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
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
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <h3 className="card-title">Blog Posts</h3>
                <p className="text-base-content/70">
                  Write and share articles with full Markdown support, categories, and tags.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-secondary"
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
                <h3 className="card-title">Podcasts</h3>
                <p className="text-base-content/70">
                  Host and share podcast episodes with an integrated audio player.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-accent"
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
                <h3 className="card-title">Comments</h3>
                <p className="text-base-content/70">
                  Engage with the community through threaded comments and discussions.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-info"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="card-title">Role-Based Access</h3>
                <p className="text-base-content/70">
                  Admin, Author, and Reader roles with granular permissions and moderation tools.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-warning"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <h3 className="card-title">30+ Themes</h3>
                <p className="text-base-content/70">
                  Switch between over 30 beautiful DaisyUI themes with a single click.
                </p>
              </div>
            </div>
            <div className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="card-title">Fully Responsive</h3>
                <p className="text-base-content/70">
                  Optimized for every device — desktop, tablet, and mobile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts Section */}
      {posts.length > 0 && (
        <section className="py-16 px-4 bg-base-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold">Latest Articles</h2>
              <Link href="/blog" className="btn btn-ghost btn-sm gap-1">
                View all
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
              {posts.map(
                (post: {
                  slug: string;
                  title: string;
                  excerpt?: string;
                  createdAt: string;
                  author: { name?: string };
                }) => (
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
                        <span>{post.author?.name || "Anonymous"}</span>
                        <span>·</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Latest Podcasts Section */}
      {podcasts.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold">Latest Episodes</h2>
              <Link href="/podcasts" className="btn btn-ghost btn-sm gap-1">
                View all
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
              {podcasts.map(
                (podcast: {
                  slug: string;
                  title: string;
                  description?: string;
                  createdAt: string;
                  author: { name?: string };
                  duration?: number;
                }) => (
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
                        <span>{podcast.author?.name || "Anonymous"}</span>
                        <span>·</span>
                        <span>{new Date(podcast.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-base-content/70 mb-8 text-lg">
            Sign in to create your own posts and podcasts, and join the conversation.
          </p>
          <Link href="/auth/signin" className="btn btn-primary btn-lg">
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
