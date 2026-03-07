import { notFound } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Comments from "@/components/Comments";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/posts/${slug}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | Blog & Podcast`,
    description: post.excerpt || post.content?.substring(0, 160),
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/blog">Blog</Link>
          </li>
          <li>{post.title}</li>
        </ul>
      </div>

      {/* Cover Image */}
      {post.coverImage && (
        <figure className="relative mb-8 h-64 md:h-96">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover rounded-xl"
            priority
          />
        </figure>
      )}

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-base-content/60 mb-4">
          <div className="flex items-center gap-2">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-8 rounded-full">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-xs">
                    {post.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>
            <span className="font-medium">{post.author.name || "Anonymous"}</span>
          </div>
          <span>·</span>
          <span>
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Tags and Categories */}
        <div className="flex flex-wrap gap-2">
          {post.categories?.map((cat: { slug: string; name: string }) => (
            <Link
              key={cat.slug}
              href={`/blog?category=${cat.slug}`}
              className="badge badge-primary"
            >
              {cat.name}
            </Link>
          ))}
          {post.tags?.map((tag: { slug: string; name: string }) => (
            <Link key={tag.slug} href={`/blog?tag=${tag.slug}`} className="badge badge-outline">
              {tag.name}
            </Link>
          ))}
        </div>
      </header>

      {/* Post Content */}
      <article className="divider" />
      <MarkdownRenderer content={post.content} />

      {/* Author Bio */}
      {post.author.bio && (
        <div className="card bg-base-200 mt-8">
          <div className="card-body flex-row items-center gap-4">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-16 rounded-full">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt=""
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-xl">
                    {post.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold">{post.author.name}</h3>
              <p className="text-base-content/60">{post.author.bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <Comments postId={post.id} initialComments={post.comments || []} />
    </div>
  );
}
