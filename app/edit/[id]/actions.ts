"use server";

import { updatePost } from "@/lib/wordpress";
import { revalidatePath } from "next/cache";

export async function updateExistingPost(postId: number, formData: FormData) {
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
    console.error("Post update error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "포스트 수정 중 오류가 발생했습니다. WordPress 연동 설정을 확인해주세요.";
    return { error: errorMessage };
  }
}
