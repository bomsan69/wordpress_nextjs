"use server";

import { createPost } from "@/lib/wordpress";
import { sendEmail } from "@/lib/sendmail";
import { revalidatePath } from "next/cache";

export async function createNewPost(formData: FormData) {
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
    console.error("Post creation error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "포스트 등록 중 오류가 발생했습니다. WordPress 연동 설정을 확인해주세요.";
    return { error: errorMessage };
  }
}
