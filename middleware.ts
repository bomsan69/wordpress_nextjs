import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("wp-admin-session");
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isAuthenticated = !!session;

  // 로그인하지 않았고 로그인 페이지가 아니면 로그인 페이지로 리다이렉트
  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 로그인했는데 로그인 페이지에 접근하면 포스트 목록으로 리다이렉트
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/posts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
