import Link from "next/link";
import Image from "next/image";

interface PostCardProps {
  post: {
    slug: string;
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    createdAt: string;
    author: { name?: string | null; image?: string | null };
    categories: { name: string; slug: string }[];
    tags: { name: string; slug: string }[];
    _count?: { comments: number };
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300">
      {post.coverImage && (
        <figure className="relative h-48">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </figure>
      )}
      <div className="card-body">
        <h2 className="card-title">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && <p className="text-base-content/70 line-clamp-3">{post.excerpt}</p>}

        <div className="flex flex-wrap gap-1 mt-2">
          {post.categories.map((cat) => (
            <span key={cat.slug} className="badge badge-primary badge-sm">
              {cat.name}
            </span>
          ))}
          {post.tags.map((tag) => (
            <span key={tag.slug} className="badge badge-outline badge-sm">
              {tag.name}
            </span>
          ))}
        </div>

        <div className="card-actions justify-between items-center mt-4">
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <span>{post.author.name || "Anonymous"}</span>
            <span>·</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            {post._count && (
              <>
                <span>·</span>
                <span>{post._count.comments} comments</span>
              </>
            )}
          </div>
          <Link href={`/blog/${post.slug}`} className="btn btn-primary btn-sm">
            Read more
          </Link>
        </div>
      </div>
    </div>
  );
}
