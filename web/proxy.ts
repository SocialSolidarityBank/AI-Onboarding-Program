import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // env 누락 시 미들웨어를 건너뛴다 (로컬 dev에서 미설정 상태로도 페이지가 보이도록)
  if (!supabaseUrl || !supabaseAnon) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // 세션 토큰 회전을 위해 호출만 (반환값은 사용 안 함)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에서 세션 쿠키를 새로 고침:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - 정적 자산 (.svg, .png 등)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
