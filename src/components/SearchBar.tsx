"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

interface SearchBarProps {
  basePath: string;
  placeholder?: string;
}

export default function SearchBar({ basePath, placeholder = "Search..." }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
      params.delete("page");
    } else {
      params.delete("search");
    }
    router.push(`${basePath}?${params.toString()}`);
  }, [query, router, basePath, searchParams]);

  return (
    <div className="join w-full max-w-md">
      <input
        type="text"
        className="input input-bordered join-item w-full"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <button className="btn btn-primary join-item" onClick={handleSearch}>
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>
  );
}
