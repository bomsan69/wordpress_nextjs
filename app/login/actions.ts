"use server";

import { redirect } from "next/navigation";
import { validateLogin, createSession } from "@/lib/auth";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const isValid = await validateLogin(username, password);

  if (!isValid) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await createSession();
  redirect("/posts");
}
