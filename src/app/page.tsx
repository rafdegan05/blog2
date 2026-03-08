import HomeContent from "@/components/HomeContent";

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

  return <HomeContent posts={posts} podcasts={podcasts} />;
}
