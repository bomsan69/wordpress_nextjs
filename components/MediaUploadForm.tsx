"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { uploadMediaAction, getMediaCsrfToken } from "@/app/media/new/actions";

export function MediaUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [title, setTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSRF 토큰 로드
  useEffect(() => {
    async function loadCsrfToken() {
      const token = await getMediaCsrfToken();
      setCsrfToken(token);
    }
    loadCsrfToken();
  }, []);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setSelectedFile(file);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(fileName);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!selectedFile || !title) {
      setError("파일과 제목을 모두 입력해주세요.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("csrf-token", csrfToken);

      await uploadMediaAction(formData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다."
      );
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {previewUrl && (
        <div className="mb-6">
          <label className="block text-senior-lg font-medium mb-3">
            미리보기
          </label>
          <div className="w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="미리보기"
              className="w-full h-auto object-contain max-h-96"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-senior-lg font-medium mb-3">
          이미지 업로드
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-senior-base text-gray-600">
              {selectedFile ? (
                <p className="font-medium text-blue-600">{selectedFile.name}</p>
              ) : (
                <>
                  <p className="font-medium">
                    클릭하여 파일 선택 또는 드래그앤드롭
                  </p>
                  <p className="text-senior-sm text-gray-500 mt-1">
                    PNG, JPG, GIF 등 이미지 파일
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-senior-lg font-medium mb-2">
          이미지 제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이미지 제목을 입력하세요"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-senior-base text-red-600">{error}</p>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isUploading || !selectedFile || !title}
          className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg text-senior-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              업로드 중...
            </>
          ) : (
            "업로드"
          )}
        </button>
      </div>
    </form>
  );
}
