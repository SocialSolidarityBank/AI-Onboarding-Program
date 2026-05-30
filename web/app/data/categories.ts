// 표준분류 + 회사 컬러 + 단위 라벨 — 차트/뱃지/표가 공유하는 단일 소스.

export const CATEGORIES = [
  "소상공인 지원",
  "세대별 맞춤 지원",
  "사회 혁신 조직 지원",
  "공익 인프라 지원",
] as const;

export const UNSET = "미분류";

// 라이트: 단계감(파랑→연파랑→인디고→먹). SVG fill은 var()를 못 받으므로 hex.
const CAT_HEX_LIGHT: Record<string, string> = {
  "소상공인 지원": "#006CB7", // --c-primary
  "세대별 맞춤 지원": "#58C5FF", // --c-sky
  "사회 혁신 조직 지원": "#26257C", // --c-dark-blue
  "공익 인프라 지원": "#0A1E33", // --c-ink-deep
  [UNSET]: "#7B7875", // --c-grey
};

// 다크: 어두운 배경에서 잘 보이게 primary·sky·light-blue·light-grey.
const CAT_HEX_DARK: Record<string, string> = {
  "소상공인 지원": "#338BC9", // primary-active (어두운 배경 가독)
  "세대별 맞춤 지원": "#58C5FF", // sky
  "사회 혁신 조직 지원": "#CDEAFF", // sky-light (light-blue)
  "공익 인프라 지원": "#ECF0F3", // light-grey
  [UNSET]: "#9aa3ad", // grey(밝게)
};

export const catHex = (cat: string | null | undefined, dark = false) => {
  const map = dark ? CAT_HEX_DARK : CAT_HEX_LIGHT;
  return (cat && map[cat]) || map[UNSET];
};

// 지원수 단위(headline_unit) → 왼쪽 스키마 라벨. 단위는 숫자 오른쪽에 별도 표기.
const UNIT_LABEL: Record<string, string> = {
  명: "지원자 수",
  개소: "지원 단체 수",
  건: "지원 건 수",
  팀: "지원 팀 수",
  개: "지원 개수",
  가구: "지원 가구 수",
};
export const unitLabel = (u: string) => UNIT_LABEL[u] ?? `지원 수(${u})`;

// 단위 컬럼 정렬 우선순위
export const UNIT_ORDER = ["명", "개소", "건", "팀", "개", "가구"];
export const sortUnits = (units: string[]) =>
  [...units].sort((a, b) => {
    const ia = UNIT_ORDER.indexOf(a);
    const ib = UNIT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
