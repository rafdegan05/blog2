import BlogContent from "@/components/BlogContent";

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

  return <BlogContent posts={posts} pagination={pagination} search={params.search} />;
}
