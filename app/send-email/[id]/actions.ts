"use server";

import { sendEmail } from "@/lib/sendmail";
import { getSession } from "@/lib/auth";
import { validateCsrfToken, getCsrfToken } from "@/lib/csrf";

// CSRF 토큰 가져오기
export async function getEmailCsrfToken(): Promise<string> {
  return await getCsrfToken();
}

export async function sendEmailAction(formData: FormData) {
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

  if (!title || !content) {
    return { error: "모든 필드를 입력해주세요." };
  }

  // 환경변수에서 받는 사람 이메일 가져오기
  const to = process.env.NOTIFICATION_EMAIL;

  if (!to) {
    console.error('[EMAIL_ERROR] NOTIFICATION_EMAIL not configured');
    return { error: "이메일 발송 설정이 올바르지 않습니다." };
  }

  try {
    await sendEmail({
      to,
      title,
      content,
    });

    return { success: true };
  } catch (error) {
    // Error already logged in sendEmail function
    return { error: "이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
