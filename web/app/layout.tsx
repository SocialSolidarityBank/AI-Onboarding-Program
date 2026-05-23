import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사내 AI 교육 · 스터디 신청",
  description:
    "사회연대은행 임직원 대상 AI 교육과 스터디 그룹 소개 및 신청 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
