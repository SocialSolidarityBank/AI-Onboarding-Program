import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import DataExplorer, { type ProgramRow } from "./DataExplorer";
import styles from "./page.module.css";

export const metadata = {
  title: "사업 데이터 — 사회연대은행",
  description: "사회연대은행 사업 성과 데이터(2003-2025) 조회",
};

// 인증·RLS 의존 — 항상 동적 렌더링
export const dynamic = "force-dynamic";

export default async function DataPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const programsRes = await supabase
    .from("programs")
    .select(
      "program_id,basis,report_year,area_code,area_name,program_name,period,headline_value,headline_unit,budget_krw,target,support_type,source_document,memo,funders,details,kpis"
    )
    .order("report_year", { ascending: false })
    .order("area_code");

  const programs = (programsRes.data ?? []) as ProgramRow[];

  // RLS상 운영자(operators)만 행이 보임 — 데이터가 있는데 0건이면 권한 없음.
  if (programs.length === 0) {
    return (
      <main className={styles.gate}>
        <div className="container">
          <h1>사업 데이터</h1>
          <p>
            이 페이지는 운영자(operators)만 조회할 수 있습니다. 권한이 필요하면
            관리자에게 문의하세요.
          </p>
          <p className={styles.gateWho}>로그인 계정: {user.email}</p>
          <Link href="/" className={styles.gateLink}>
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  return <DataExplorer programs={programs} email={user.email ?? ""} />;
}
