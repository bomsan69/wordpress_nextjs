"use server";

import { uploadMedia } from "@/lib/wordpress";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { validateCsrfToken, getCsrfToken } from "@/lib/csrf";
import { validateFile } from "@/lib/validation";

// CSRF 토큰 가져오기
export async function getMediaCsrfToken(): Promise<string> {
  return await getCsrfToken();
}

export async function uploadMediaAction(formData: FormData) {
  // Authentication check
  const isAuthenticated = await getSession();
  if (!isAuthenticated) {
    throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
  }

  // CSRF protection
  const csrfToken = formData.get("csrf-token") as string;
  const isValidCsrf = await validateCsrfToken(csrfToken);

  if (!isValidCsrf) {
    throw new Error("잘못된 요청입니다. 페이지를 새로고침 후 다시 시도해주세요.");
  }

  const file = formData.get("file") as File;
  const title = formData.get("title") as string;

  if (!file || !title) {
    throw new Error("파일과 제목을 모두 입력해주세요.");
  }

  // Validate file
  const validation = await validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    await uploadMedia(file, title);
  } catch (error) {
    console.error('[MEDIA_UPLOAD_ERROR]', {
      timestamp: new Date().toISOString(),
      fileName: file.name,
      fileSize: file.size,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error("이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }

  redirect("/media");
}
