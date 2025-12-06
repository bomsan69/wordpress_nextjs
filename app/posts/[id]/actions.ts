"use server";

import { deletePost } from "@/lib/wordpress";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deletePostAction(postId: number) {
  try {
    await deletePost(postId);

    // 캐시 무효화
    revalidatePath("/posts");

    return { success: true };
  } catch (error) {
    console.error("포스트 삭제 실패:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "포스트 삭제 중 오류가 발생했습니다.";
    return { error: errorMessage };
  }
}
