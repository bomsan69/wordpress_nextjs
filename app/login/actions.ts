"use server";

import { redirect } from "next/navigation";
import { validateLogin, createSession } from "@/lib/auth";
import { validateCsrfToken } from "@/lib/csrf";

export async function login(formData: FormData) {
  // CSRF protection
  const csrfToken = formData.get("csrf-token") as string;
  const isValidCsrf = await validateCsrfToken(csrfToken);

  if (!isValidCsrf) {
    return { error: "잘못된 요청입니다. 페이지를 새로고침 후 다시 시도해주세요." };
  }

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    const isValid = await validateLogin(username, password);

    if (!isValid) {
      return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
    }

    await createSession();
    redirect("/posts");
  } catch (error) {
    // Handle rate limiting errors
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "로그인 처리 중 오류가 발생했습니다." };
  }
}
