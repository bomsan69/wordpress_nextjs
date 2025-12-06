"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WPPost } from "@/types/wordpress";

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
    <div className="px-6 py-6 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <Link href={`/posts/${post.id}`} className="block">
            <div className="flex items-start gap-3 mb-2">
              <h2 className="text-senior-xl font-semibold text-gray-900">
                {post.title.rendered}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-senior-sm font-medium flex-shrink-0 ${
                  post.status === "publish"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {post.status === "publish" ? "publish" : "draft"}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-senior-base text-gray-600">
              <span>작성자: {author}</span>
              <span>|</span>
              <span>{new Date(post.date).toLocaleDateString("ko-KR")}</span>
              {categoryNames.length > 0 && (
                <>
                  <span>|</span>
                  <span>{categoryNames.join(", ")}</span>
                </>
              )}
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {post.status === "draft" ? (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-senior-base hover:bg-blue-700 transition-colors"
            >
              수정
            </button>
          ) : (
            <button
              onClick={handleSendEmailClick}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-senior-base hover:bg-green-700 transition-colors"
            >
              메일보내기
            </button>
          )}
          <Link
            href={`/posts/${post.id}`}
            className="text-blue-600 text-senior-lg block px-2"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  );
}
