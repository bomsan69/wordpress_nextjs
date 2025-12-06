"use client";

import { WPCategory, WPUser } from "@/types/wordpress";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface SearchFilterProps {
  categories: WPCategory[];
  users: WPUser[];
  currentPeriod?: string;
}

export function SearchFilter({ categories, users, currentPeriod }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    if (period) params.set("period", period);
    if (selectedCategories) params.set("categories", selectedCategories);
    if (selectedAuthor) params.set("author", selectedAuthor);
    params.set("page", "1");

    router.push(`/posts?${params.toString()}`);
  }

  function handleReset() {
    setPeriod("1m");
    setSelectedCategories("");
    setSelectedAuthor("");
    router.push("/posts");
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-senior-xl font-bold mb-6">검색 필터</h2>
      <form onSubmit={handleSearch} className="space-y-6">
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

        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg text-senior-lg font-medium hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg text-senior-lg font-medium hover:bg-gray-400 transition-colors"
          >
            초기화
          </button>
        </div>
      </form>
    </div>
  );
}
