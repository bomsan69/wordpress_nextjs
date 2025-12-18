"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WPPost } from "@/types/wordpress";
import { getRelativeTimeString, stripHtmlTags, truncateText } from "@/lib/date-utils";

interface PostListItemProps {
  post: WPPost;
  author: string;
  categoryNames: string[];
}

export function PostListItem({
  post,
  author,
  categoryNames,
}: PostListItemProps) {
  const router = useRouter();

  // Excerpt 추출 (HTML 태그 제거 및 길이 제한)
  const excerptText = post.excerpt?.rendered
    ? truncateText(stripHtmlTags(post.excerpt.rendered), 150)
    : "";

  // 상대적인 시간 표시
  const relativeTime = getRelativeTimeString(post.date);
  const formattedDate = new Date(post.date).toLocaleDateString("ko-KR");

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/edit/${post.id}`);
  };

  const handleSendEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/send-email/${post.id}`);
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex-1 min-w-0">
          <Link href={`/posts/${post.id}`} className="block group">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-3">
              <h2 className="text-senior-lg sm:text-senior-xl font-semibold text-gray-900 break-words group-hover:text-blue-600 transition-colors">
                {post.title.rendered}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-senior-sm font-medium flex-shrink-0 self-start ${
                  post.status === "publish"
                    ? "bg-green-100 text-green-800"
                    : post.status === "future"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {post.status === "publish"
                  ? "publish"
                  : post.status === "future"
                  ? "scheduled"
                  : "draft"}
              </span>
            </div>

            {excerptText && (
              <p className="text-senior-sm sm:text-senior-base text-gray-600 mb-3 leading-relaxed">
                {excerptText}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-senior-sm sm:text-senior-base text-gray-600">
                <span>작성자: {author}</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span className="font-medium text-gray-700" title={formattedDate}>
                  {relativeTime}
                </span>
              </div>

              {categoryNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categoryNames.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-senior-xs sm:text-senior-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 self-start lg:self-auto">
          {post.status === "draft" || post.status === "future" ? (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-senior-sm sm:text-senior-base hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              수정
            </button>
          ) : (
            <button
              onClick={handleSendEmailClick}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-senior-sm sm:text-senior-base hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              메일보내기
            </button>
          )}
          <Link
            href={`/posts/${post.id}`}
            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
            aria-label="자세히 보기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
