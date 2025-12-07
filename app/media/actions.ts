"use server";

import { deleteMedia } from "@/lib/wordpress";
import { revalidatePath } from "next/cache";

export async function deleteMediaAction(mediaId: number) {
  try {
    await deleteMedia(mediaId);
    revalidatePath("/media");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "이미지 삭제에 실패했습니다.",
    };
  }
}
