import Link from "next/link";
import { DOMAIN_ERROR } from "@/lib/constants";
import styles from "./page.module.css";

type SearchParams = Promise<{ reason?: string; msg?: string }>;

const REASON_MESSAGES: Record<string, string> = {
  "no-code": "로그인 링크가 만료되었거나 올바르지 않습니다. 다시 요청해 주세요.",
  exchange: "로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.",
  domain: DOMAIN_ERROR,
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const reason = params.reason ?? "";
  const message =
    REASON_MESSAGES[reason] ?? "로그인에 실패했습니다. 다시 시도해 주세요.";

  return (
    <main className={styles.main}>
      <div className={`container ${styles.box}`}>
        <h1 className={styles.title}>로그인 오류</h1>
        <p className={styles.message}>{message}</p>
        {params.msg ? (
          <p className={styles.detail}>세부 정보: {params.msg}</p>
        ) : null}
        <Link href="/login" className={styles.cta}>
          로그인 페이지로 돌아가기
        </Link>
      </div>
    </main>
  );
}
