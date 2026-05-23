"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/constants";
import { sendSubmissionConfirmation } from "@/lib/email";
import { getProgramById } from "@/lib/programs";

export type ApplyFormState =
  | { kind: "idle" }
  | { kind: "ok"; email: string; updated: boolean }
  | { kind: "error"; message: string };

export async function submitApplication(
  _prev: ApplyFormState,
  formData: FormData
): Promise<ApplyFormState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      kind: "error",
      message: "로그인 정보가 만료되었습니다. 로그인 페이지에서 다시 시도해 주세요.",
    };
  }
  if (!isAllowedEmail(user.email)) {
    return {
      kind: "error",
      message: "회사 계정(@bss.or.kr, @ggbss.or.kr)만 신청 가능합니다.",
    };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const team = (formData.get("team") as string | null)?.trim() ?? "";
  const programIds = formData.getAll("program_ids").map((v) => String(v));
  const tools = formData.getAll("tools").map((v) => String(v));
  const toolsOther = (formData.get("tools_other") as string | null)?.trim() || null;
  const expectations =
    (formData.get("expectations") as string | null)?.trim() || null;
  const availableDays = formData.getAll("available_days").map((v) => String(v));
  const learningGoals = formData
    .getAll("learning_goals")
    .map((v) => String(v));

  if (!name || !team || !programIds.length) {
    return {
      kind: "error",
      message:
        "이름·소속·희망 그룹은 필수 입력입니다. 희망 그룹은 1개 이상 선택해 주세요.",
    };
  }

  if (learningGoals.length > 2) {
    return {
      kind: "error",
      message: "교육에서 얻고자 하는 것은 최대 2개까지 선택할 수 있습니다.",
    };
  }

  // 기존 신청 확인 (메시지 처리용)
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  const { error } = await supabase
    .from("applications")
    .upsert(
      {
        email: user.email,
        name,
        team,
        program_ids: programIds,
        tools,
        tools_other: toolsOther,
        expectations,
        available_days: availableDays,
        learning_goals: learningGoals,
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (error) {
    return {
      kind: "error",
      message: `신청 저장 중 오류가 발생했습니다. (${error.message})`,
    };
  }

  // 신청 확인 메일 발송 — 실패해도 신청 자체는 성공 처리.
  // Phase H: API 키/도메인 인증 전엔 sendSubmissionConfirmation 내부에서 skip.
  //
  // after()로 응답 종료 후 실행을 보장한다. void fire-and-forget은
  // 서버리스(예: Vercel functions)에서 응답 직후 런타임이 동결되면
  // 메일 Promise가 중간에 끊길 수 있으므로 사용 금지.
  const programTitles = programIds
    .map((id) => getProgramById(id)?.title)
    .filter((t): t is string => Boolean(t));
  const recipient = user.email;

  after(async () => {
    try {
      await sendSubmissionConfirmation({
        to: recipient,
        name,
        team,
        programTitles,
        availableDays,
        tools,
        toolsOther,
        learningGoals,
        expectations,
      });
    } catch (err) {
      console.error("[apply] confirmation mail dispatch failed", err);
    }
  });

  revalidatePath("/apply");
  return { kind: "ok", email: user.email, updated: Boolean(existing) };
}
