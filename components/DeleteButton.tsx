"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction, getCsrfTokenAction } from "@/app/posts/[id]/actions";

interface DeleteButtonProps {
  postId: number;
  postTitle: string;
}

export function DeleteButton({ postId, postTitle }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Load CSRF token on mount
  useEffect(() => {
    async function loadToken() {
      try {
        const token = await getCsrfTokenAction();
        setCsrfToken(token);
      } catch (error) {
        console.error("Failed to load CSRF token");
      }
    }
    loadToken();
  }, []);

  async function handleDelete() {
    const confirmed = window.confirm(
      `정말로 이 포스트를 삭제하시겠습니까?\n\n"${postTitle}"\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      // Pass CSRF token to server action
      const result = await deletePostAction(postId, csrfToken);

      if (result.error) {
        alert(`삭제 실패: ${result.error}`);
        setIsDeleting(false);
      } else {
        alert("포스트가 삭제되었습니다.");
        router.push("/posts");
        router.refresh();
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting || !csrfToken}
      className="px-6 py-3 bg-red-600 text-white rounded-lg text-senior-base font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[48px]"
    >
      {isDeleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
