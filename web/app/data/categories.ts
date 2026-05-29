// 표준분류 + 회사 컬러 + 단위 라벨 — 차트/뱃지/표가 공유하는 단일 소스.

export const CATEGORIES = [
  "소상공인 지원",
  "세대별 맞춤 지원",
  "사회 혁신 조직 지원",
  "공익 인프라 지원",
] as const;

export const UNSET = "미분류";

// 회사 컬러(_v2/tokens.css)와 동일 hex. SVG fill은 var()를 못 받으므로 hex로 둔다.
// primary / dark-blue / sky / ink-deep / grey
// 4분류 단계감 최대화 (primary → sky → dark-blue → ink-deep): 어두운 두 색이 인접하지 않게.
export const CAT_HEX: Record<string, string> = {
  "소상공인 지원": "#006CB7", // --c-primary (파랑)
  "세대별 맞춤 지원": "#58C5FF", // --c-sky (연파랑)
  "사회 혁신 조직 지원": "#26257C", // --c-dark-blue (인디고)
  "공익 인프라 지원": "#0A1E33", // --c-ink-deep (먹)
  [UNSET]: "#7B7875", // --c-grey
};

export const catHex = (cat: string | null | undefined) =>
  (cat && CAT_HEX[cat]) || CAT_HEX[UNSET];

// 지원수 단위(headline_unit) → 왼쪽 스키마 라벨. 단위는 숫자 오른쪽에 별도 표기.
const UNIT_LABEL: Record<string, string> = {
  명: "지원자 수",
  개소: "지원 단체 수",
  건: "지원 건 수",
  팀: "지원 팀 수",
  개: "지원 개수",
  가구: "지원 가구 수",
};
export const unitLabel = (u: string) => UNIT_LABEL[u] ?? "지원 수";
