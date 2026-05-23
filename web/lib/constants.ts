// 사내 계정 도메인 화이트리스트
// project-bss-domain-whitelist 메모리 참조 — 두 도메인 모두 사내, 어느 쪽이든 신청 가능
export const ALLOWED_EMAIL_DOMAINS = ["bss.or.kr", "ggbss.or.kr"] as const;

export const DOMAIN_HINT = "회사 계정(@bss.or.kr, @ggbss.or.kr)으로 신청해 주세요";
export const DOMAIN_ERROR = "회사 계정(@bss.or.kr, @ggbss.or.kr)만 신청 가능합니다";

export function isAllowedEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  const at = lower.lastIndexOf("@");
  if (at < 1) return false;
  const domain = lower.slice(at + 1);
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}
