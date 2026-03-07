"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="join flex justify-center mt-8">
      <button
        className="join-item btn btn-sm"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        «
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={`join-item btn btn-sm ${page === currentPage ? "btn-active" : ""}`}
          onClick={() => goToPage(page)}
        >
          {page}
        </button>
      ))}
      <button
        className="join-item btn btn-sm"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        »
      </button>
    </div>
  );
}
