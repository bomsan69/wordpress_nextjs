import Link from "next/link";
import { getPost } from "@/lib/wordpress";
import { Navbar } from "@/components/Navbar";
import { DeleteButton } from "@/components/DeleteButton";
import { notFound } from "next/navigation";
import { sanitizeHTML, isHTMLSafe } from "@/lib/html-sanitizer";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const postId = parseInt(id);

  if (isNaN(postId)) {
    notFound();
  }

  let post;
  try {
    post = await getPost(postId);
  } catch (error) {
    notFound();
  }

//docer test

  const author = post._embedded?.author?.[0]?.name || "알 수 없음";
  const categoryNames =
    post._embedded?.["wp:term"]?.[0]?.map((cat) => cat.name) || [];

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = sanitizeHTML(post.content.rendered);

  // Additional safety check
  if (!isHTMLSafe(sanitizedContent)) {
    notFound(); // Reject obviously malicious content
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/posts"
            className="inline-flex items-center text-senior-base text-blue-600 hover:text-blue-700"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b-2 border-gray-200">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
              <h1 className="text-senior-xl sm:text-senior-2xl lg:text-senior-3xl font-bold flex-1 break-words">
                {post.title.rendered}
              </h1>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-senior-sm font-medium ${
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
                {(post.status === "draft" || post.status === "future") && (
                  <DeleteButton postId={postId} postTitle={post.title.rendered} />
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-senior-sm sm:text-senior-base text-gray-600">
              <span>작성자: {author}</span>
              <span className="hidden sm:inline">|</span>
              <span>{new Date(post.date).toLocaleDateString("ko-KR")}</span>
              {categoryNames.length > 0 && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <span>카테고리: {categoryNames.join(", ")}</span>
                </>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-8 py-6 sm:py-8">
            <div
              className="prose prose-lg max-w-none text-senior-sm sm:text-senior-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              style={{
                fontSize: "clamp(18px, 4vw, 20px)",
                lineHeight: "1.8",
              }}
            />
          </div>

          <div className="px-4 sm:px-8 py-4 sm:py-6 border-t-2 border-gray-200 bg-gray-50">
            <div className="text-senior-sm sm:text-senior-base text-gray-600">
              <p>최종 수정: {new Date(post.modified).toLocaleString("ko-KR")}</p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
