"use server";

import { uploadMedia } from "@/lib/wordpress";
import { redirect } from "next/navigation";

export async function uploadMediaAction(formData: FormData) {
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;

  if (!file || !title) {
    throw new Error("파일과 제목을 모두 입력해주세요.");
  }

  try {
    await uploadMedia(file, title);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`업로드 실패: ${error.message}`);
    }
    throw new Error("이미지 업로드에 실패했습니다.");
  }

  redirect("/media");
}
