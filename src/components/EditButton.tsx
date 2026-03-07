"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

interface EditButtonProps {
  href: string;
  authorId: string;
  label?: string;
}

export default function EditButton({ href, authorId, label = "Edit" }: EditButtonProps) {
  const { data: session } = useSession();

  if (!session) return null;
  if (session.user?.id !== authorId && session.user?.role !== "ADMIN") return null;

  return (
    <Link href={href} className="btn btn-ghost btn-sm gap-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      {label}
    </Link>
  );
}
