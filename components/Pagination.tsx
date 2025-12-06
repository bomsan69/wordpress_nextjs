"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  function createPageURL(pageNumber: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-4 mt-8">
      <Link
        href={createPageURL(currentPage - 1)}
        className={`px-6 py-3 rounded-lg text-senior-base ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
            : "bg-blue-600 text-white hover:bg-blue-700"
        } transition-colors`}
      >
        이전
      </Link>

      <span className="text-senior-lg font-medium">
        {currentPage} / {totalPages}
      </span>

      <Link
        href={createPageURL(currentPage + 1)}
        className={`px-6 py-3 rounded-lg text-senior-base ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
            : "bg-blue-600 text-white hover:bg-blue-700"
        } transition-colors`}
      >
        다음
      </Link>
    </div>
  );
}
