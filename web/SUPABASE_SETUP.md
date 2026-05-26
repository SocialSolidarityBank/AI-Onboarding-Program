# Supabase 운영자 셋업 가이드

> **Doc version**: v3 · **Updated**: 2026-05-25
> **기준 콘솔**: Supabase Dashboard 2026-05 (메뉴 트리 `Auth > ...`)
> **대상 코드 베이스**: `/web` (Next.js 16 App Router, `@supabase/ssr`)

이 문서는 `/web` 폴더의 신청 페이지를 **Supabase 무료티어**로 띄우기 위해 운영자가 직접 콘솔에서 해야 하는 작업을 처음부터 순서대로 안내합니다.

---

## 0. 한눈에 보는 체크리스트 (TL;DR)

```
□ Supabase 가입 + 무료 organization 생성
□ 신규 프로젝트 생성 (region: Northeast Asia / Seoul 권장)
□ Project Settings > API Keys 에서 URL + publishable key 복사
□ web/.env.local 작성 + Vercel env 동기화
□ SQL Editor 에서 0001_applications.sql 실행 (테이블 + RLS)
□ Auth > URL Configuration 에서 Site URL · Redirect URLs 등록
□ Auth > Providers > Email 에서 Magic Link 활성 확인
□ Auth > Email Templates 에서 Magic Link 한국어 본문 적용 (선택)
□ 두 도메인(@bss.or.kr, @ggbss.or.kr) 각각 매직링크 → 폼 제출 E2E
□ 비허용 도메인(@gmail.com) 차단 검증
```

---

## 1. 프로젝트 생성

1. https://supabase.com 가입 (GitHub 계정 가능)
2. 좌측 상단 **+ New project** 클릭
3. Organization: 개인 free org 선택 (없으면 `Create a new organization`, **Free** 플랜)
4. Project 입력값
   - **Name**: `bss-ai-onboarding` 등 자유롭게
   - **Database password**: 강한 랜덤 비밀번호 (브라우저 비밀번호 매니저나 1Password에 저장 — 분실 시 재설정만 가능, 직접 조회 불가)
   - **Region**: `Northeast Asia (Seoul)` 권장 (한국 사용자 응답 속도 최단)
   - **Pricing plan**: **Free**
5. **Create new project** → 1~2분 대기 (DB 프로비저닝)

> ℹ️ 무료 플랜 한도(2026-05 기준): DB 500 MB · Auth MAU 50,000 · Edge Functions 500K invocations/월 · Storage 1 GB. 사내 임직원 신청 규모로는 충분합니다.

---

## 2. API 키 가져오기 (⚠️ 2026년 키 체계 전환 중)

Supabase는 2026년 중 기존 `anon`/`service_role` 키 → 새 `sb_publishable_*`/`sb_secret_*` 키로 마이그레이션이 진행 중입니다. **기존 키는 2026년 말까지 호환**되지만, 신규 프로젝트는 새 키 체계로 만들어지는 추세입니다.

### 대시보드 경로
**Project Settings → API Keys** (좌측 사이드바 아이콘 ⚙️ → API Keys 탭)

### 복사해야 할 값
- **Project URL** (`https://xxxxxxxx.supabase.co`)
- **Publishable key** (`sb_publishable_...`) — 클라이언트/브라우저용
  - 신규 프로젝트가 이 키만 제공하는 경우, 본 코드는 동일하게 동작합니다 (anon 자리에 publishable 키 넣어도 됨)
  - 구 프로젝트에서 보이는 `anon public` 키 (`eyJ...`)도 그대로 호환됩니다 (~2026-12)
- **Secret key** (`sb_secret_...`) — 서버 전용, 본 페이지는 사용하지 않음 (RLS로 보호되므로 anon-side 키만으로 충분)

### `.env.local` 작성
`web/.env.example`을 `web/.env.local`로 복사 후 값을 채웁니다.

```bash
# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx_or_eyJxxx_legacy
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> 💡 변수명은 코드 호환을 위해 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 로 유지하지만, 값은 신·구 키 모두 통과합니다. 추후 새 키만 사용한다고 확신이 들면 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 로 리네이밍 가능 (이때 `web/lib/supabase/*.ts` 두 곳의 환경변수 참조도 함께 변경).

운영(Vercel) 배포 시 동일한 키들을 **Project Settings → Environment Variables** 에 추가하세요. `NEXT_PUBLIC_SITE_URL` 만 운영 도메인(`https://<vercel-domain>`)으로 바꿔서 넣습니다.

---

## 3. DB 스키마 적용 (테이블 + RLS)

### 3-1. SQL 실행
**SQL Editor → New query** (좌측 사이드바의 `< >` 아이콘)
`web/supabase/migrations/0001_applications.sql` 파일을 통째로 붙여넣고 **Run** 버튼.

성공하면 우측 패널에 `Success. No rows returned` 메시지가 표시됩니다.

### 3-2. 검증
**Table Editor → applications** 진입 → 컬럼이 다음과 같이 보이는지 확인:

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid | PK, default `uuid_generate_v4()` |
| email | text | UNIQUE |
| name | text | |
| team | text | |
| program_id | text | Markdown 프로그램 id 참조 |
| tools | text[] | |
| tools_other | text | nullable |
| expectations | text[] | |
| difficult_days | text[] | |
| level_check_response_id | uuid | nullable, Phase C 연결 |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()`, trigger 갱신 |

**Authentication → Policies** 에서 `applications` 테이블에 3개 정책이 보이면 OK:
- `own row select` (SELECT, authenticated)
- `own row insert` (INSERT, authenticated)
- `own row update` (UPDATE, authenticated)

### 3-3. RLS 동작 원리
- 신청자는 매직링크 인증 후 JWT를 갖고 클라이언트에서 직접 INSERT/UPDATE 호출
- 정책의 `(auth.jwt() ->> 'email') = email` 가 행 단위로 검사되어, 다른 사람의 row는 절대 못 보거나 못 바꿈
- 운영자(Supabase Studio 로그인)는 RLS 우회로 모든 row 조회 가능

> ⚙️ **성능 팁 (대규모 운영 시)**: 행 수가 많아지면 정책을 `((select auth.jwt() ->> 'email')) = email` 형태로 `select`로 감싸면 Postgres가 statement 단위로 결과를 캐시해 더 빠릅니다. 임직원 수 단위(<1,000행) 규모에서는 차이 없음.

---

## 4. Auth 설정

### 4-1. Email 프로바이더 (Magic Link + OTP 코드)
**Auth → Sign In / Up → Email** (옛 메뉴: `Auth > Providers > Email`)

- **Enable Email provider**: ON (기본)
- **Enable Email signups**: ON ← 신청 페이지는 첫 방문자가 자동 가입되어야 동작
- **Confirm email**: ON 권장 (사용자가 메일을 실제 받을 수 있어야 함)
- **Enable Magic Link / Sign in with OTP**: ON ← 본 페이지 핵심
- **Email OTP Length**: 6~10자리 (코드 입력 UI는 `\d{6,10}` 로 받음). 6자리 권장
- **Secure email change**: ON (기본 유지)

### 4-2. URL Configuration (가장 중요)
**Auth → URL Configuration**

| 항목 | 로컬 개발 값 | 운영 값 |
|---|---|---|
| **Site URL** | `http://localhost:3000` | `https://<your-vercel-domain>` |
| **Redirect URLs (Additional)** | `http://localhost:3000/auth/callback` | `https://<your-vercel-domain>/auth/callback` |

> 두 환경 모두 운영 중이면 둘 다 등록(콤마 분리). 미등록 URL은 매직링크 클릭 후 "Invalid redirect URL" 에러 발생.
>
> 와일드카드 지원: `*` (구분자 제외), `**` (모든 문자), Vercel preview 도메인 패턴 예: `https://*-<team-slug>.vercel.app/**`. preview 배포에서도 매직링크 테스트하려면 이 패턴 추가.

### 4-3. 이메일 템플릿 (필수)
**Auth → Email Templates → Magic Link** + **Confirm signup** (둘 다 동일 본문 권장)

본 코드는 **OTP 코드 입력 흐름이 기본**이고 매직 링크는 같은 브라우저용 fallback 입니다. 따라서 **두 템플릿 모두 `{{ .Token }}` 과 `{{ .ConfirmationURL }}` 을 함께 포함**해야 합니다. Magic Link / Confirm signup 양쪽에 동일 본문을 넣는 이유: 신규 가입자(첫 OTP 요청)는 Confirm signup 템플릿이, 기존 사용자는 Magic Link 템플릿이 발송되어 UX가 갈리지 않게 하기 위함.

사용 가능한 변수:
- `{{ .Token }}` — 인증 코드 (자릿수는 Email OTP Length 설정값)
- `{{ .ConfirmationURL }}` — 매직 링크 URL
- `{{ .SiteURL }}`, `{{ .Email }}`

> 📌 본 페이지의 카피 정책상 운영자가 직접 문구를 정해주셔야 합니다 (Claude 자체 생성 금지). 한국어 본문 초안이 필요하면 알려주세요.
> 디자인 컬러는 브랜드 primary (`#006cb7`) 적용 — 인증 코드 글자, 링크 버튼 배경, URL 텍스트.

### 4-4. Rate Limit & 보안 (그대로 둬도 OK)
**Auth → Rate Limits** (필요 시만)
- 기본값: 동일 IP/이메일 기준 매직링크 1회당 60초 쿨다운
- 사내 임직원 규모에선 기본값 충분

### 4-5. 로그인 흐름 아키텍처 (v3 — 2026-05-25 갱신)

본 코드는 **OTP 코드 입력을 1차 경로**로, 매직링크를 2차 경로로 사용합니다.

**왜 OTP 코드인가** — 매직링크의 PKCE 흐름은 **링크를 같은 브라우저에서 클릭해야만 동작**합니다. 사용자가 모바일 메일앱에서 링크를 열거나 PC와 모바일 브라우저가 다르면 `PKCE code verifier not found` 에러로 로그인 실패. 사내 메일 환경(Outlook 데스크톱·웹·모바일 혼용)에서는 cross-device 발생 빈도가 매우 높음. OTP 코드는 사용자가 직접 입력하므로 어디서 메일을 열어도 안전.

**흐름**
1. `/login` — 이메일 입력 → `signInWithOtp` 호출 (코드+링크 둘 다 발송됨)
2. 동일 페이지에서 **인증 코드 입력 단계로 전환** → 사용자가 메일의 코드 입력 → `verifyOtp({ type: 'email' })` → 세션 확립 → `window.location.href = '/apply'` 풀 페이지 이동
3. 또는 (fallback) 같은 브라우저에서 메일 링크 클릭 → `/auth/callback?code=...` → `exchangeCodeForSession` → `/apply`

**세션 관리**
- `/login` 진입 시 기존 세션 감지 → 다른 계정으로 로그인된 상태면 상단에 "현재 X으로 로그인되어 있습니다 [로그아웃]" 노출
- `/apply` 헤더에 로그아웃 버튼 (POST `/auth/signout`)
- `/auth/signout` route handler → `supabase.auth.signOut()` → `/login` 으로 303 redirect

---

## 4b. 시크릿 관리 (1Password CLI)

### 원칙
- 평문 `.env.local` 은 worktree 간에 자동 복사되지 않고(`gitignore`), 로컬 디스크에 평문으로 남는 게 부담
- 1Password CLI 의 `op run` 으로 **항상 vault에서 주입**하면 worktree·머신 옮겨도 동일한 키 사용

### 사전 셋업 (1회)
1. `op` CLI 설치 (macOS: `brew install 1password-cli`)
2. 1Password 대시보드 → **Developer Tools → Service Accounts → Create** (vault 접근 권한 부여)
3. 발급된 `ops_...` 토큰을 `~/.zshrc` 에 영구 등록:
   ```bash
   export OP_SERVICE_ACCOUNT_TOKEN="ops_..."
   ```
4. 검증: `op whoami` → `User Type: SERVICE_ACCOUNT`

### vault 아이템 구성 (`seongqkim-bss` vault)
| 아이템 | 필드 | env 매핑 |
|---|---|---|
| Supabase | `Publishable_Key` (add more 섹션) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Resend | `api_key` (로그인 방식 섹션) | `RESEND_API_KEY` |
| notion | `api-key` | `NOTION_API_KEY` |

### `.env.1password` (커밋 가능, 시크릿 없음)
시크릿은 `op://...` 참조, 공개값(URL, EMAIL_FROM, DB ID 등)은 평문. `web/.gitignore` 에 `!.env.1password` 예외 등록 필요.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=op://seongqkim-bss/Supabase/add more/Publishable_Key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=op://seongqkim-bss/Resend/Section_xxxxx/api_key
EMAIL_FROM="사회연대은행 <noreply@mail.ggbss.or.kr>"
NOTION_API_KEY=op://seongqkim-bss/notion/xxxxx/api-key
NOTION_APPLICATIONS_DB_ID=<db-id>
```

### 실행
```bash
cd web
op run --env-file=.env.1password -- npm run dev
op run --env-file=.env.1password -- npm run build
```

`op run` 이 `op://` 참조를 vault에서 가져와 실제 값으로 치환 후 child process에 주입. 평문은 디스크에 남지 않음.

### 새 worktree에서 즉시 사용
별도 복사 작업 없음 — 위 스텝(zshrc + `.env.1password` 가 레포에 있음)만 만족하면 새 worktree에서도 그대로 `op run` 만 실행.

---

## 5. 도메인 화이트리스트 (이중 방어선)

코드 측 두 단계로 비허용 도메인을 차단합니다:

1. **클라이언트 ([app/login/page.tsx](app/login/page.tsx))** — 이메일 입력 시 `bss.or.kr` 또는 `ggbss.or.kr` 이외는 inline 에러
2. **서버 ([app/auth/callback/route.ts](app/auth/callback/route.ts))** — 매직링크 콜백에서 JWT 도메인 재검증, 비허용은 즉시 `signOut` 후 `/auth/error?reason=domain`

### (선택) 서버 측 추가 방어
무료 플랜에서도 **Auth Hooks → Send signup email Hook** 에 Edge Function을 붙여 도메인 검증 후 이메일 발송 자체를 막을 수 있습니다.
- **Database → Functions** 에서 함수 생성 → **Auth → Hooks** 에서 hook 연결
- 코드 측 2단 방어로 사실상 차단되므로 필수는 아니지만, 매직링크 메일이 발송되는 것 자체를 막고 싶다면 추가

---

## 6. 운영자 일상 점검 루틴

### 신청 현황 확인
**Table Editor → applications** → 우측 상단 **Filters / Sort** 로 program_id, created_at 등으로 필터링.
**CSV Export** 가능 (우측 상단 ⋮ 메뉴).

### 매직링크 메일 발송 로그
**Auth → Users → (특정 유저 클릭) → Activity** 에서 send 기록 확인.
전체 로그는 **Logs → Auth Logs** 에서 조회 (필터: `magiclink`).

### 가입자 목록
**Auth → Users** — 매직링크 한번이라도 클릭한 사람은 여기 등록됨. 신청 폼 미제출자(가입만 한 사람)는 `applications` 테이블엔 없음. 차이를 보면 "메일은 받았지만 폼을 안 낸 사람" 추적 가능.

### 활성 매직링크 만료
기본 24시간. **Auth → URL Configuration → OTP Expiry** 에서 조정 (최대 86400초).

---

## 7. E2E 검증 시나리오

`.env.local` 채우고 `cd web && npm run dev` 후:

1. `http://localhost:3000` 접속 → 랜딩 페이지 정상
2. 상단/하단 **신청하기** 클릭 → `/apply` 진입 → 미인증이면 `/login`으로 redirect
3. `name@bss.or.kr` 입력 → 매직링크 발송 → 메일 클릭
4. 자동으로 `/apply` 진입 → 폼 채우고 제출 → "신청이 접수되었습니다" 화면
5. **Supabase Studio → Table Editor → applications** 에서 row 확인
6. 같은 메일로 `/apply` 재진입 → 이전 값 prefill → 일부 수정 → 다시 제출 → **같은 row가 update** (id 동일, updated_at 변경)
7. `name@ggbss.or.kr` 로도 1~5번 반복 → 두 도메인 모두 통과 확인
8. `name@gmail.com` 시도 → `/login` 단계에서 inline 에러 "회사 계정(@bss.or.kr, @ggbss.or.kr)만 신청 가능합니다"
9. (선택) 비허용 도메인으로 매직링크가 어떻게든 발급된 케이스 — `/auth/callback` 에서 차단되어 `/auth/error?reason=domain` 페이지

---

## 8. 트러블슈팅

| 증상 | 원인 / 조치 |
|---|---|
| 매직링크 클릭 시 `Invalid redirect URL` | **Auth → URL Configuration → Redirect URLs** 에 `<your-domain>/auth/callback` 미등록. 로컬·운영 둘 다 등록. |
| 매직링크 메일이 오지 않음 | (1) **Auth → Users** 에서 가입자 생성 여부 확인 → 없으면 클라이언트 도메인 검증에 막힌 것. (2) 있으면 **Logs → Auth Logs** 에서 send 실패 확인. (3) 무료티어 기본 SMTP 발송량 한도 도달 가능성 — Custom SMTP(Auth → Email > SMTP) 설정 검토. |
| 폼 제출 시 `42501 permission denied for table applications` | RLS 정책 미적용 또는 사용자가 인증되지 않음. **Authentication → Policies** 에서 3개 정책 활성 확인. `proxy.ts` 정상 동작 여부도 확인 (env 누락 시 세션 갱신 안 됨). |
| 같은 메일 재제출이 새 row 만듬 | RLS update 정책 누락 가능. SQL `0001_applications.sql` 다시 실행. |
| `/auth/error?reason=exchange` | 매직링크가 만료됐거나 한번 사용된 링크 재클릭. 다시 로그인 페이지에서 발급. |
| `/auth/error` 세부정보에 `PKCE code verifier not found in storage` | 폼을 제출한 브라우저와 링크를 연 브라우저/디바이스가 다름 (cross-device). 메일의 인증 코드를 신청 페이지에 직접 입력하면 우회 가능. 영구 해결책은 사용자 안내(같은 브라우저에서 열기) 또는 메일에서 링크 블록 제거. |
| Confirm signup vs Magic Link 템플릿이 다른 메일로 보임 | 신규 가입자는 Confirm signup, 기존 사용자는 Magic Link 템플릿이 발송됨. 두 템플릿을 동일 본문으로 통일해야 UX 균일. |
| 새 worktree에서 `Your project's URL and Key are required` 런타임 에러 | `.env.local` 은 gitignore라 worktree 간 자동 복사 안 됨. `op run --env-file=.env.1password -- npm run dev` 로 실행하거나 옆 worktree에서 복사. |
| 비허용 도메인(@gmail 등)이 통과됨 | (드물지만) 클라이언트 우회 + 콜백 검증 우회 동시 발생 시. `app/auth/callback/route.ts`의 `isAllowedEmail()` 호출 확인. |

---

## 9. 코드 참조 인덱스

| 파일 | 역할 |
|---|---|
| `web/proxy.ts` | Next.js 16 `proxy.ts` (옛 `middleware.ts`). 세션 쿠키 회전 |
| `web/lib/supabase/server.ts` | 서버 컴포넌트·Server Action 용 클라이언트 |
| `web/lib/supabase/client.ts` | 브라우저 클라이언트 (싱글톤) |
| `web/lib/constants.ts` | 허용 도메인 + 안내/에러 문구 |
| `web/supabase/migrations/0001_applications.sql` | 테이블 + RLS |
| `web/app/login/page.tsx` | OTP 코드 입력 + 매직링크 fallback, 세션 감지 + 로그아웃 |
| `web/app/auth/callback/route.ts` | exchangeCodeForSession + 서버 도메인 재검증 (매직링크 클릭 시) |
| `web/app/auth/signout/route.ts` | POST signout → /login 으로 redirect |
| `web/app/apply/page.tsx` | 인증 게이트 + 기존 신청 prefill + 로그아웃 버튼 |
| `web/.env.1password` | 1Password 참조 env 템플릿 (`op run` 으로 주입) |
| `web/app/apply/ApplyForm.tsx` | 폼 UI (useActionState) |
| `web/app/apply/actions.ts` | Server Action upsert |

---

## 10. 향후 마이그레이션 메모

### 키 체계 (2026 말까지 필수)
- 신규 프로젝트가 `sb_publishable_*` / `sb_secret_*` 만 발급한다면, 그 값을 그대로 현 env 변수에 넣어도 동작
- 2026-12 이후 구 `anon`/`service_role` 키 deprecate 예정
- `getClaims()` 도입 검토: 현재 코드는 `supabase.auth.getUser()` 사용 (안전하지만 매번 네트워크 round-trip 발생). 신규 SDK에서는 `getClaims()` 가 JWT 검증만 로컬에서 수행해 더 빠름. 트래픽이 늘어나면 마이그레이션 권장.

### `getClaims()` 마이그레이션 시점 가이드
- 현재 (소형 사내 페이지): `getUser()` 그대로 유지 — 안전·검증된 패턴
- 트래픽 증가 또는 콜드스타트 비용 신경 쓰일 때: `apply/page.tsx`·`apply/actions.ts`·`auth/callback/route.ts` 의 `getUser()` 호출을 `getClaims()` 로 교체 (반환 형태가 `{ claims: { email, sub, ... } }` 로 바뀌므로 코드 조정 필요)

---

## 변경 이력

### v3 — 2026-05-25
- 로그인 흐름을 OTP 코드 입력 1차 / 매직링크 fallback 2차로 전환 (cross-device PKCE 실패 근본 해결)
- `/login` 에 기존 세션 감지 + 로그아웃 버튼 추가
- `/apply` 헤더에 로그아웃 버튼 + `app/auth/signout/route.ts` 신설
- 시크릿 관리 섹션 (4b) 신설 — 1Password CLI `op run` 사용 표준 절차
- 이메일 템플릿 정책 갱신 — Magic Link / Confirm signup 둘 다 동일 본문, `{{ .Token }}` + `{{ .ConfirmationURL }}` 동시 포함, brand primary `#006cb7` 적용
- 트러블슈팅에 PKCE cross-device, 템플릿 분기, worktree env 누락 3건 추가
- 코드 참조 인덱스에 signout route + `.env.1password` 추가

### v2 — 2026-05-23
- Supabase Dashboard 2026-05 메뉴 트리 반영 (`Authentication` → `Auth`)
- `sb_publishable_*` / `sb_secret_*` 키 전환 안내 추가 (2026 말까지 호환)
- RLS 성능 팁(`(select auth.jwt() ...)` 캐싱) 추가
- 트러블슈팅 섹션 신설 (6 케이스)
- 코드 참조 인덱스 추가
- `getClaims()` 향후 마이그레이션 가이드 추가
- Vercel preview 도메인 와일드카드 패턴 예시 추가
- 운영자 일상 점검 루틴 섹션 신설

### v1 — 2026-05-22 (초안, Phase B 작성 시점)
- 최초 작성 — 7단계 기본 셋업 + E2E 시나리오 4건
