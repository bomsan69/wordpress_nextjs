"use client";

import { WPCategory, WPUser } from "@/types/wordpress";
import { createNewPost } from "@/app/posts/new/actions";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface PostFormProps {
  categories: WPCategory[];
  users: WPUser[];
}

export function PostForm({ categories, users }: PostFormProps) {
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // 기본값 찾기
  const sleeplessCategory = categories.find(
    (cat) => cat.name === "Sleepless"
  );
  const jayChoUser = users.find((user) => user.name === "Jay Cho");

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await createNewPost(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result?.success && result.postId) {
      // 성공: 폼 초기화 후 리스트 페이지로 이동
      formRef.current?.reset();
      setContentLength(0);
      router.refresh(); // 클라이언트 캐시 갱신
      router.push("/posts");
    }
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContentLength(e.target.value.length);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-8">
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
        <textarea
          id="content"
          name="content"
          required
          rows={15}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="본문을 입력하세요"
          onChange={handleContentChange}
        />
        <div className="mt-2 text-right">
          <span className="text-senior-base text-gray-600">
            현재 글자수: <span className="font-semibold">{contentLength.toLocaleString()}</span>자
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
          defaultValue={sleeplessCategory?.id.toString() || ""}
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
          defaultValue={jayChoUser?.id.toString() || ""}
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

      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg text-senior-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "등록 중..." : "포스트 등록"}
        </button>
        <a
          href="/posts"
          className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg text-senior-lg font-medium hover:bg-gray-400 transition-colors text-center"
        >
          취소
        </a>
      </div>
    </form>
  );
}
