"use server";

import { sendEmail } from "@/lib/sendmail";

export async function sendEmailAction(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    return { error: "모든 필드를 입력해주세요." };
  }

  // 환경변수에서 받는 사람 이메일 가져오기
  const to = process.env.NOTIFICATION_EMAIL || "bomsan69@gmail.com";

  try {
    await sendEmail({
      to,
      title,
      content,
    });

    return { success: true };
  } catch (error) {
    console.error("이메일 발송 실패:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "이메일 발송 중 오류가 발생했습니다.";
    return { error: errorMessage };
  }
}
