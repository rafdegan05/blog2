import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

interface BlogPageProps {
  searchParams: Promise<{ page?: string; search?: string; category?: string; tag?: string }>;
}

async function getPosts(params: {
  page?: string;
  search?: string;
  category?: string;
  tag?: string;
}) {
  const url = new URL(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/posts`);
  if (params.page) url.searchParams.set("page", params.page);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.tag) url.searchParams.set("tag", params.tag);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return { posts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    return res.json();
  } catch {
    return { posts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const { posts, pagination } = await getPosts(params);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="text-base-content/60 mt-2">
            {pagination.total} article{pagination.total !== 1 ? "s" : ""} published
          </p>
        </div>
        <SearchBar basePath="/blog" placeholder="Search articles..." />
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">No posts found</h2>
          <p className="text-base-content/60">
            {params.search
              ? `No results for "${params.search}". Try a different search.`
              : "No blog posts yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: Record<string, unknown>) => (
              <PostCard key={post.slug as string} post={post as never} />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            basePath="/blog"
          />
        </>
      )}
    </div>
  );
}
