"use server";

import { deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteCsrfToken } from "@/lib/csrf";

export async function logout() {
  await deleteSession();
  await deleteCsrfToken();
  redirect("/login");
}
