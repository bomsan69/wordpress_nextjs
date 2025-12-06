import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordPress 포스트 관리",
  description: "WordPress 포스트 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
