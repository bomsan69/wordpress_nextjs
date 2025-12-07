"use client";

import { useState, useEffect } from "react";
import { deleteMediaAction, getCsrfTokenAction } from "@/app/media/actions";

interface MediaDeleteButtonProps {
  mediaId: number;
  mediaTitle: string;
}

export function MediaDeleteButton({
  mediaId,
  mediaTitle,
}: MediaDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setIsDeleting(true);
    try {
      // Pass CSRF token to server action
      const result = await deleteMediaAction(mediaId, csrfToken);
      if (result.success) {
        setShowConfirm(false);
      } else {
        alert(`삭제 실패: ${result.error}`);
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? `삭제 실패: ${error.message}`
          : "이미지 삭제에 실패했습니다."
      );
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting || !csrfToken}
        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-senior-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? "삭제 중..." : "삭제"}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-senior-xl font-bold mb-4">이미지 삭제</h3>
            <p className="text-senior-base text-gray-700 mb-6">
              &quot;{mediaTitle}&quot; 이미지를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg text-senior-base font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg text-senior-base font-medium hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
