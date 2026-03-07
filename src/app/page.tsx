import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero min-h-[70vh] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold">
              Welcome to <span className="text-primary">Blog & Podcast</span>
            </h1>
            <p className="py-6 text-lg text-base-content/70">
              Discover insightful articles and engaging podcasts on technology, development, and
              more. Share your thoughts and connect with the community.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/blog" className="btn btn-primary btn-lg">
                📝 Read Blog
              </Link>
              <Link href="/podcasts" className="btn btn-secondary btn-lg">
                🎧 Listen Podcasts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="card-title">Blog Posts</h3>
                <p className="text-base-content/70">
                  Write and share articles with Markdown support, categories, and tags.
                </p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">🎙️</div>
                <h3 className="card-title">Podcasts</h3>
                <p className="text-base-content/70">
                  Host and share podcast episodes with built-in audio player support.
                </p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="card-title">Comments</h3>
                <p className="text-base-content/70">
                  Engage with the community through threaded comments and discussions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-base-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-base-content/70 mb-8">
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
