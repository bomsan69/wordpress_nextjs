"use server";

import { deletePost } from "@/lib/wordpress";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCsrfToken } from "@/lib/csrf";

// Get CSRF token for client-side use
export async function getCsrfTokenAction(): Promise<string> {
  return await getCsrfToken();
}

export async function deletePostAction(postId: number, csrfToken?: string) {
  // Authentication check
  const isAuthenticated = await getSession();
  if (!isAuthenticated) {
    return { error: "인증이 필요합니다. 다시 로그인해주세요." };
  }

  // CSRF protection
  const { validateCsrfToken } = await import("@/lib/csrf");
  const isValidCsrf = await validateCsrfToken(csrfToken || null);

  if (!isValidCsrf) {
    return { error: "잘못된 요청입니다. 페이지를 새로고침 후 다시 시도해주세요." };
  }

  try {
    await deletePost(postId);

    // 캐시 무효화
    revalidatePath("/posts");

    return { success: true };
  } catch (error) {
    // Log error server-side only (don't expose details to client)
    console.error('[POST_DELETE_ERROR]', {
      timestamp: new Date().toISOString(),
      postId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { error: "포스트 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
