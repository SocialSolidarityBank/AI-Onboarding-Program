import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/constants";
import { getAllPrograms } from "@/lib/programs";
import ApplyForm, { type InitialValues } from "./ApplyForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAllowedEmail(user.email)) {
    redirect("/login");
  }

  const programs = getAllPrograms();
  const { data: existing } = await supabase
    .from("applications")
    .select(
      "name, team, program_ids, tools, tools_other, expectations, available_days, learning_goals"
    )
    .eq("email", user.email)
    .maybeSingle();

  const initial: InitialValues = {
    email: user.email,
    name: existing?.name ?? "",
    team: existing?.team ?? "",
    programIds: existing?.program_ids ?? [],
    tools: existing?.tools ?? [],
    toolsOther: existing?.tools_other ?? "",
    expectations: existing?.expectations ?? "",
    availableDays: existing?.available_days ?? [],
    learningGoals: existing?.learning_goals ?? [],
  };

  return (
    <main className={styles.main}>
      <div className={`container ${styles.wrap}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>AI 교육 · 스터디 신청</h1>
          <div className={styles.accountRow}>
            <p className={styles.lead}>
              로그인 계정: <strong>{user.email}</strong>
            </p>
            <form action="/auth/signout" method="post">
              <button type="submit" className={styles.signOutBtn}>
                로그아웃
              </button>
            </form>
          </div>
          {existing ? (
            <p className={styles.note}>
              이전 신청 내역을 불러왔습니다. 수정이 필요한 경우 내용을 바꾸고 다시 제출해 주세요.
            </p>
          ) : null}
        </header>

        <ApplyForm initial={initial} programs={programs} />
      </div>
    </main>
  );
}
