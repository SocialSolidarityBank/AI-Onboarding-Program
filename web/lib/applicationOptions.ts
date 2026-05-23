/**
 * 신청 폼 객관식 옵션
 *
 * 카피 정책: 사용자 지정 또는 V3 원문 인용만. Claude 자체 카피 금지.
 *
 * TEAM_OPTIONS: 운영자 확정 부서 12개(가나다 순) + 기타(직접입력)
 * TOOL_OPTIONS: 사용자가 직접 지정한 6개 + 기타(직접 입력)
 * DIFFICULT_DAYS: 요일 5개 (※ 의미는 "참여 가능 요일"로 반전됨 — Phase C)
 */

/**
 * 소속/팀 옵션 — 가나다 순 + 말미에 "없음", "기타(직접입력)".
 * 사용자 명시 목록(2026-05 운영자 확정).
 */
export const TEAM_OPTIONS = [
  "경기금융지원센터",
  "경영지원부",
  "미래사업부",
  "사무국",
  "사회적금융센터",
  "윤리경영실",
  "이사회",
  "자립성장지원센터",
  "재무관리부",
  "청년육성지원센터",
  "없음",
] as const;

export const TEAM_OTHER_VALUE = "기타(직접입력)";

export const TOOL_OPTIONS = [
  "ChatGPT",
  "Codex",
  "Claude",
  "Claude-Cowork",
  "Claude-Code",
  "Gemini",
] as const;

export const TOOL_OTHER_VALUE = "기타";

export const DIFFICULT_DAYS = ["월", "화", "수", "목", "금"] as const;

/**
 * 교육에서 얻고자 하는 것 — 최대 2개 선택.
 * 운영자(2026-05) 제공 13개 문안.
 */
export const LEARNING_GOAL_OPTIONS = [
  "바이브 코더가 되어 개발 지식을 학습하고 싶다",
  "다른 동료들과 함께 AI 관련 학습을 하고 싶다",
  "AI 트렌드와 정보를 얻고 싶다",
  "나만의 제품(프로덕트)이나 시스템을 만들어 보고 싶다",
  "콘텐츠(인스타그램, 영상, 카드뉴스 등)를 생산하고 싶다",
  "전방위 업무 비서처럼 사용하고 싶다",
  "AI가 내 문서(엑셀, 한글 등) 작업을 도와줬으면 좋겠다",
  "사업 소개 자료(PPT, PDF 등)를 만들고 싶다",
  "웹 개발 및 관리(예시: 사업 소개 랜딩 페이지 개발)에 사용하고 싶다",
  "참여자 데이터를 분석하고 싶다",
  "마케팅 도구(광고나 SEO 세팅 등)로 사용하고 싶다",
  "이메일 자동 회신, 데이터 자동 정리 같은 자동화를 하고 싶다",
  "AI 활용을 넘어 전문가가 되고 싶다",
] as const;

export const LEARNING_GOAL_MAX = 2;
