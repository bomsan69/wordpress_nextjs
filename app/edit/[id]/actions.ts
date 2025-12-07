"use server";

import { updatePost } from "@/lib/wordpress";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { validateCsrfToken, getCsrfToken } from "@/lib/csrf";

// CSRF 토큰 가져오기
export async function getEditCsrfToken(): Promise<string> {
  return await getCsrfToken();
}

export async function updateExistingPost(postId: number, formData: FormData) {
  // Authentication check
  const isAuthenticated = await getSession();
  if (!isAuthenticated) {
    return { error: "인증이 필요합니다. 다시 로그인해주세요." };
  }

  // CSRF protection
  const csrfToken = formData.get("csrf-token") as string;
  const isValidCsrf = await validateCsrfToken(csrfToken);

  if (!isValidCsrf) {
    return { error: "잘못된 요청입니다. 페이지를 새로고침 후 다시 시도해주세요." };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const categories = formData.get("categories") as string;
  const author = formData.get("author") as string;

  if (!title || !content || !categories || !author) {
    return { error: "모든 필드를 입력해주세요." };
  }

  try {
    await updatePost(postId, {
      title,
      content,
      categories: [parseInt(categories)],
      author: parseInt(author),
      status: "draft",
    });

    // 캐시 무효화: 리스트 페이지와 상세 페이지 갱신
    revalidatePath("/posts");
    revalidatePath(`/posts/${postId}`);

    return { success: true, postId };
  } catch (error) {
    // Log error server-side only (don't expose details to client)
    console.error('[POST_UPDATE_ERROR]', {
      timestamp: new Date().toISOString(),
      postId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { error: "포스트 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
