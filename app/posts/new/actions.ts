"use server";

import { createPost } from "@/lib/wordpress";
import { sendEmail } from "@/lib/sendmail";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { validateCsrfToken } from "@/lib/csrf";

export async function createNewPost(formData: FormData) {
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
    const post = await createPost({
      title,
      content,
      categories: [parseInt(categories)],
      author: parseInt(author),
      status: "draft",
    });

    // 캐시 무효화: 리스트 페이지 갱신
    revalidatePath("/posts");

    // 포스트 등록 알림 이메일 발송
    try {
      const notificationEmail = process.env.NOTIFICATION_EMAIL || "bomsan69@gmail.com";
      await sendEmail({
        to: notificationEmail,
        title: `새 포스트 등록: ${title}`,
        content: `새로운 포스트가 등록되었습니다.\n\n제목: ${title}\n\n내용:\n${content.substring(0, 200)}...`,
      });
    } catch (emailError) {
      console.error("이메일 발송 실패:", emailError);
      // 이메일 발송 실패는 포스트 등록 성공에 영향을 주지 않음
    }

    return { success: true, postId: post.id };
  } catch (error) {
    // Log error server-side only (don't expose details to client)
    console.error('[POST_CREATE_ERROR]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { error: "포스트 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
