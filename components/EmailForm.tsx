"use client";

import { WPPost } from "@/types/wordpress";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendEmailAction, getEmailCsrfToken } from "@/app/send-email/[id]/actions";

interface EmailFormProps {
  post: WPPost;
}

export function EmailForm({ post }: EmailFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState<string>("");

  // CSRF 토큰 로드
  useEffect(() => {
    async function loadCsrfToken() {
      const token = await getEmailCsrfToken();
      setCsrfToken(token);
    }
    loadCsrfToken();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const result = await sendEmailAction(formData);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else {
        alert("이메일이 성공적으로 발송되었습니다.");
        router.push("/posts");
      }
    } catch (err) {
      setError("이메일 발송 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CSRF 토큰 */}
      <input type="hidden" name="csrf-token" value={csrfToken} />

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-senior-base">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-senior-lg font-medium mb-2">
          제목
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={post.title.rendered}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-senior-lg font-medium mb-2">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={15}
          placeholder="메시지를 입력하세요..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-green-600 text-white px-6 py-4 rounded-lg text-senior-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[48px]"
        >
          {isSubmitting ? "발송 중..." : "이메일 발송"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/posts")}
          className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg text-senior-lg font-medium hover:bg-gray-400 transition-colors min-h-[48px]"
        >
          취소
        </button>
      </div>
    </form>
  );
}
