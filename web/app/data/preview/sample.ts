// QA 전용 샘플 데이터 — 4분류·3기준·여러 단위·null 예산·백서(2003-2022)·미분류를 모두 커버.
import type { ProgramRow, AreaSummaryRow } from "../DataExplorer";

export const SAMPLE_PROGRAMS: ProgramRow[] = [
  {
    program_id: "2025-A1-01", basis: "report", report_year: 2025, area_code: "A1",
    area_name: "마이크로크레딧을 통한 포용적 금융 접근성 강화", program_name: "함께온기금 (예비)창업자금 대출사업",
    period: "2025.01~12", headline_value: 1240, headline_unit: "명", budget_krw: 2_000_000_000,
    target: "예비창업자", support_type: "대출", source_document: "2025 연차보고서", memo: null,
    funders: [{ funder: "함께온기금", result: "집행", fund_size_krw: 2_000_000_000 }],
    details: [{ item: "신규 대출", value: 1240, unit: "명", amount_krw: 2_000_000_000 }],
    kpis: [{ metric: "상환율", value: 96, unit: "%" }], tags: null, category_std: "소상공인 지원",
  },
  {
    program_id: "2025-A2-02", basis: "report", report_year: 2025, area_code: "A2",
    area_name: "청년통합 지원사업", program_name: "저소득 청년 자산형성 지원사업 '알파챌린지'",
    period: "2025.03~12", headline_value: 320, headline_unit: "명", budget_krw: 1_350_000_000,
    target: "저소득 청년", support_type: "자산형성", source_document: "2025 연차보고서", memo: "만족도 조사 동반",
    funders: [{ funder: "두나무", result: "집행", fund_size_krw: 1_350_000_000 }],
    details: [], kpis: [{ metric: "만족도", value: 4.6, unit: "점" }], tags: null, category_std: "세대별 맞춤 지원",
  },
  {
    program_id: "2024-LSI-03", basis: "ledger", report_year: 2024, area_code: "L-SI",
    area_name: "사회혁신조직 지원 (원장)", program_name: "한전KDN 사회적경제 K-스타기업 육성사업",
    period: "2024", headline_value: 18, headline_unit: "개소", budget_krw: 3_407_000_000,
    target: "사회적경제조직", support_type: "성장지원", source_document: "재무결산", memo: null,
    funders: [{ funder: "한전KDN", result: "집행", fund_size_krw: 3_407_000_000 }],
    details: [], kpis: [], tags: null, category_std: "사회 혁신 조직 지원",
  },
  {
    program_id: "2024-A4-04", basis: "report", report_year: 2024, area_code: "A4",
    area_name: "공익 인프라 확충", program_name: "복지시설지원사업",
    period: "2024", headline_value: 42, headline_unit: "건", budget_krw: null,
    target: "복지시설", support_type: "시설지원", source_document: "2024 연차보고서", memo: "예산 미기재",
    funders: [], details: [], kpis: [], tags: null, category_std: "공익 인프라 지원",
  },
  {
    program_id: "WP-05", basis: "whitepaper", report_year: 2022, area_code: "WP-MC",
    area_name: "마이크로크레딧을 통한 포용적 금융 접근성 강화", program_name: "20주년 누적 — 소상공인 마이크로크레딧",
    period: "2003~2022", headline_value: 38000, headline_unit: "명", budget_krw: 280_000_000_000,
    target: "소상공인", support_type: "대출", source_document: "20주년 백서", memo: "20년 누적치",
    funders: [], details: [], kpis: [], tags: null, category_std: "소상공인 지원",
  },
  {
    program_id: "2025-A2-06", basis: "report", report_year: 2025, area_code: "A2",
    area_name: "세대별 맞춤 자립 지원", program_name: "자립준비청년 일자리 지원사업 '두나무 넥스트 잡'",
    period: "2025", headline_value: 210, headline_unit: "명", budget_krw: 900_000_000,
    target: "자립준비청년", support_type: "일자리", source_document: "2025 연차보고서", memo: null,
    funders: [], details: [], kpis: [], tags: null, category_std: "세대별 맞춤 지원",
  },
  {
    program_id: "2024-A9-07", basis: "report", report_year: 2024, area_code: "A9",
    area_name: "영역 미귀속 특별섹션", program_name: "분류 미지정 시범사업",
    period: "2024", headline_value: 5, headline_unit: "팀", budget_krw: 120_000_000,
    target: "시범", support_type: "기타", source_document: "2024 연차보고서", memo: null,
    funders: [], details: [], kpis: [], tags: null, category_std: null,
  },
];

export const SAMPLE_AREA_SUMMARY: AreaSummaryRow[] = [
  { basis: "report", report_year: 2025, area_code: "A1", area_name: "소상공인 지원", budget_krw: 2_000_000_000 },
  { basis: "report", report_year: 2025, area_code: "A2", area_name: "청년통합 지원", budget_krw: 2_300_000_000 },
  { basis: "ledger", report_year: 2024, area_code: "L-SI", area_name: "사회혁신조직 지원 (원장)", budget_krw: 3_407_372_960 },
];
