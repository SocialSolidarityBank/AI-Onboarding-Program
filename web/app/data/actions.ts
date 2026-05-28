"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TagResult =
  | { ok: true; affected: number }
  | { ok: false; message: string };

type ProgramKey = { id: string; basis: string };

export async function applyTag(
  keys: ProgramKey[],
  tag: string,
  op: "add" | "remove"
): Promise<TagResult> {
  const clean = tag.trim();
  if (!clean) return { ok: false, message: "태그를 입력해 주세요." };
  if (!keys.length) return { ok: false, message: "선택된 사업이 없습니다." };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { data, error } = await supabase.rpc("programs_apply_tag", {
    p_keys: keys,
    p_tag: clean,
    p_op: op,
  });

  if (error) {
    // RLS 위반(비운영자) 등은 권한 오류로 안내
    return { ok: false, message: `태그 저장 실패: ${error.message}` };
  }

  revalidatePath("/data");
  return { ok: true, affected: (data as number) ?? 0 };
}
