import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/apply";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/auth/error?reason=no-code`);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${siteUrl}/auth/error?reason=exchange&msg=${encodeURIComponent(error.message)}`
    );
  }

  // 도메인 재검증 (방어선 2 — 클라이언트 검증을 우회한 케이스 차단)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email || !isAllowedEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${siteUrl}/auth/error?reason=domain`);
  }

  return NextResponse.redirect(`${siteUrl}${next}`);
}
