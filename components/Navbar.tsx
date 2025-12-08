"use client";

import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 데스크톱 네비게이션 */}
        <div className="hidden lg:flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <Link
              href="/posts"
              className="text-senior-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              WordPress 관리
            </Link>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <Link
                  href="/posts"
                  className="text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
                >
                  포스트 목록
                </Link>
                <Link
                  href="/posts/new"
                  className="text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
                >
                  새 글 작성
                </Link>
              </div>
              <div className="border-l-2 border-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/media"
                  className="text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
                >
                  이미지 목록
                </Link>
                <Link
                  href="/media/new"
                  className="text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
                >
                  이미지 등록
                </Link>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>

        {/* 모바일 네비게이션 */}
        <div className="lg:hidden">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/posts"
              className="text-senior-lg font-bold text-gray-900"
            >
              WordPress 관리
            </Link>
            <div className="flex items-center gap-2">
              <LogoutButton />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="메뉴 열기"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* 모바일 메뉴 */}
          {isMenuOpen && (
            <div className="py-4 space-y-2 border-t-2 border-gray-200">
              <div className="space-y-2">
                <div className="text-senior-sm font-semibold text-gray-500 px-4 py-2">
                  포스트
                </div>
                <Link
                  href="/posts"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-3 rounded-lg transition-colors"
                >
                  포스트 목록
                </Link>
                <Link
                  href="/posts/new"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-3 rounded-lg transition-colors"
                >
                  새 글 작성
                </Link>
              </div>
              <div className="border-t-2 border-gray-200 my-2"></div>
              <div className="space-y-2">
                <div className="text-senior-sm font-semibold text-gray-500 px-4 py-2">
                  이미지
                </div>
                <Link
                  href="/media"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-3 rounded-lg transition-colors"
                >
                  이미지 목록
                </Link>
                <Link
                  href="/media/new"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-3 rounded-lg transition-colors"
                >
                  이미지 등록
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
