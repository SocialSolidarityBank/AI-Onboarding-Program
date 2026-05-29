import { notFound } from "next/navigation";
import DataExplorer from "../DataExplorer";
import { SAMPLE_PROGRAMS, SAMPLE_AREA_SUMMARY } from "./sample";

// QA 전용 미리보기 — 인증/DB 없이 샘플 데이터로 UI 렌더.
// 운영 빌드에서는 접근 불가(notFound). QA 후 이 폴더는 삭제 예정.
export const dynamic = "force-static";

export default function DataPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <DataExplorer
      programs={SAMPLE_PROGRAMS}
      areaSummary={SAMPLE_AREA_SUMMARY}
      email="qa@preview"
    />
  );
}
