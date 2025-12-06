import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "wp-admin-session";

// 로그인 검증
export async function validateLogin(
  username: string,
  password: string
): Promise<boolean> {
  const adminId = process.env.ADMIN_ID;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminId || !adminPassword) {
    throw new Error("Admin credentials not configured");
  }

  return username === adminId && password === adminPassword;
}

// 세션 생성
export async function createSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

// 세션 확인
export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return !!session;
}

// 세션 삭제 (로그아웃)
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
