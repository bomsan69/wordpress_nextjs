"use client";

import { WPCategory, WPUser } from "@/types/wordpress";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface SearchFilterProps {
  categories: WPCategory[];
  users: WPUser[];
  currentPeriod?: string;
}

export function SearchFilter({ categories, users, currentPeriod }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(true);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [period, setPeriod] = useState(
    searchParams.get("period") || currentPeriod || "1m"
  );
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get("categories") || ""
  );
  const [selectedAuthor, setSelectedAuthor] = useState(
    searchParams.get("author") || ""
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (period) params.set("period", period);
    if (selectedCategories) params.set("categories", selectedCategories);
    if (selectedAuthor) params.set("author", selectedAuthor);
    params.set("page", "1");

    startTransition(() => {
      router.push(`/posts?${params.toString()}`);
    });
  }

  function handleReset() {
    setSearchQuery("");
    setPeriod("1m");
    setSelectedCategories("");
    setSelectedAuthor("");
    router.push("/posts");
  }

  // 활성화된 필터 개수 계산
  const activeFiltersCount = [
    searchQuery,
    period !== "1m" ? period : null,
    selectedCategories,
    selectedAuthor,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <div className="p-4 sm:p-6 flex justify-between items-center border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-senior-lg sm:text-senior-xl font-bold">검색 및 필터</h2>
          {activeFiltersCount > 0 && (
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-senior-sm font-medium">
              {activeFiltersCount}개 적용
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900 transition-colors p-2"
          aria-label={isExpanded ? "필터 접기" : "필터 펼치기"}
        >
          <svg
            className={`w-6 h-6 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSearch} className="p-4 sm:p-6 space-y-6">
          <div>
            <label htmlFor="search" className="block text-senior-lg font-medium mb-3">
              검색
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목 또는 내용으로 검색..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-senior-lg font-medium mb-3">
                기간
              </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "1m", label: "1달" },
                { value: "3m", label: "3개월" },
                { value: "6m", label: "6개월" },
                { value: "all", label: "전체" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer text-senior-base font-medium transition-colors ${
                    period === option.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="period"
                    value={option.value}
                    checked={period === option.value}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-senior-lg font-medium mb-2">
              카테고리
            </label>
            <select
              value={selectedCategories}
              onChange={(e) => setSelectedCategories(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-senior-lg font-medium mb-2">
              등록자
            </label>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg text-senior-base sm:text-senior-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                조회 중...
              </>
            ) : (
              "검색"
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg text-senior-base sm:text-senior-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            초기화
          </button>
        </div>
        </form>
      )}
    </div>
  );
}
