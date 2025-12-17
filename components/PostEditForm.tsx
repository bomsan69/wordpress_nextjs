"use client";

import { WPCategory, WPUser, WPPost } from "@/types/wordpress";
import { updateExistingPost, getEditCsrfToken } from "@/app/edit/[id]/actions";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { TiptapEditor } from "@/components/TiptapEditor";

interface PostEditFormProps {
  post: WPPost;
  categories: WPCategory[];
  users: WPUser[];
}

export function PostEditForm({ post, categories, users }: PostEditFormProps) {
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(post.content.rendered);
  const [contentLength, setContentLength] = useState(
    post.content.rendered.replace(/<[^>]*>/g, "").length
  );
  const [csrfToken, setCsrfToken] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // CSRF 토큰 로드
  useEffect(() => {
    async function loadCsrfToken() {
      const token = await getEditCsrfToken();
      setCsrfToken(token);
    }
    loadCsrfToken();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await updateExistingPost(post.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result?.success && result.postId) {
      // 클라이언트 캐시도 갱신
      router.refresh();
      router.push(`/posts`);
    }
  }

  function handleContentChange(html: string) {
    setContent(html);
    // HTML 태그 제거하여 순수 텍스트 길이 계산
    const plainText = html.replace(/<[^>]*>/g, "");
    setContentLength(plainText.length);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-8">
      {/* CSRF 토큰 */}
      <input type="hidden" name="csrf-token" value={csrfToken} />

      <div>
        <label
          htmlFor="title"
          className="block text-senior-lg font-medium mb-2"
        >
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={post.title.rendered}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="제목을 입력하세요"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-senior-lg font-medium mb-2"
        >
          본문 <span className="text-red-500">*</span>
        </label>
        <input type="hidden" name="content" value={content} required />
        <TiptapEditor
          content={content}
          onChange={handleContentChange}
          placeholder="본문을 입력하세요"
        />
        <div className="mt-2 text-right">
          <span className="text-senior-base text-gray-600">
            현재 글자수:{" "}
            <span className="font-semibold">
              {contentLength.toLocaleString()}
            </span>
            자
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor="categories"
          className="block text-senior-lg font-medium mb-2"
        >
          카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          id="categories"
          name="categories"
          required
          defaultValue={post.categories[0]?.toString() || ""}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">카테고리를 선택하세요</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="author"
          className="block text-senior-lg font-medium mb-2"
        >
          등록자 <span className="text-red-500">*</span>
        </label>
        <select
          id="author"
          name="author"
          required
          defaultValue={post.author.toString()}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">등록자를 선택하세요</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
          <p className="text-senior-base text-red-800">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg text-senior-base sm:text-senior-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "수정 중..." : "포스트 수정"}
        </button>
        <a
          href={`/posts/${post.id}`}
          className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg text-senior-base sm:text-senior-lg font-medium hover:bg-gray-400 transition-colors text-center"
        >
          취소
        </a>
        <div className="flex-1">
          <DeleteButton
            postId={post.id}
            postTitle={post.title.rendered}
            buttonText="포스트 삭제"
            className="w-full px-6 py-4 bg-red-600 text-white rounded-lg text-senior-base sm:text-senior-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </form>
  );
}
