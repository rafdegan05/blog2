import PodcastsContent from "@/components/PodcastsContent";

interface PodcastsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function getPodcasts(params: { page?: string; search?: string }) {
  const url = new URL(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/podcasts`);
  if (params.page) url.searchParams.set("page", params.page);
  if (params.search) url.searchParams.set("search", params.search);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok)
      return { podcasts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    return res.json();
  } catch {
    return { podcasts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }
}

export default async function PodcastsPage({ searchParams }: PodcastsPageProps) {
  const params = await searchParams;
  const { podcasts, pagination } = await getPodcasts(params);

  return <PodcastsContent podcasts={podcasts} pagination={pagination} search={params.search} />;
}
