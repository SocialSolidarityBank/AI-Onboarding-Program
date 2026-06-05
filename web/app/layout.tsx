import type { Metadata } from "next";
import "./_v2/tokens.css";
import "./tailwind.css";
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
        {/* Satoshi — 숫자 강조용 (--ff-en). Fontshare CDN */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@500,600,700,400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
