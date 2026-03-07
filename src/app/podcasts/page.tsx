import PodcastCard from "@/components/PodcastCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Podcasts</h1>
          <p className="text-base-content/60 mt-2">
            {pagination.total} episode{pagination.total !== 1 ? "s" : ""} available
          </p>
        </div>
        <SearchBar basePath="/podcasts" placeholder="Search podcasts..." />
      </div>

      {podcasts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold mb-2">No podcasts found</h2>
          <p className="text-base-content/60">
            {params.search
              ? `No results for "${params.search}". Try a different search.`
              : "No podcast episodes yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast: Record<string, unknown>) => (
              <PodcastCard key={podcast.slug as string} podcast={podcast as never} />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            basePath="/podcasts"
          />
        </>
      )}
    </div>
  );
}
