"use server";

import { deleteMedia } from "@/lib/wordpress";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getCsrfToken } from "@/lib/csrf";

// Get CSRF token for client-side use
export async function getCsrfTokenAction(): Promise<string> {
  return await getCsrfToken();
}

export async function deleteMediaAction(mediaId: number, csrfToken?: string) {
  // Authentication check
  const isAuthenticated = await getSession();
  if (!isAuthenticated) {
    return { success: false, error: "인증이 필요합니다. 다시 로그인해주세요." };
  }

  // CSRF protection
  const { validateCsrfToken } = await import("@/lib/csrf");
  const isValidCsrf = await validateCsrfToken(csrfToken || null);

  if (!isValidCsrf) {
    return { success: false, error: "잘못된 요청입니다. 페이지를 새로고침 후 다시 시도해주세요." };
  }

  try {
    await deleteMedia(mediaId);
    revalidatePath("/media");
    return { success: true };
  } catch (error) {
    console.error('[MEDIA_DELETE_ERROR]', {
      timestamp: new Date().toISOString(),
      mediaId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      success: false,
      error: "이미지 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}
