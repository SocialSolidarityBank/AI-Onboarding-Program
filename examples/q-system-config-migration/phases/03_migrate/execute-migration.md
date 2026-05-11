# Phase 3: 마이그레이션 실행

## Agent
- **Model**: Kimi K2 (OpenRouter)
- **Tool**: opencode (yolo-mode), `~/Code/q-system-config`
- **병렬**: ×

## Depends on
- Phase 1: `Q/_migration-staging/PLAN.md`, `CLASSIFICATION.md`
- Phase 2: 레포 골격 + AGENTS.md

## Goal
PLAN.md 따라 mechanical 마이그레이션 일괄 수행. 판단 필요한 부분 0.

## Inputs
- `@Q/_migration-staging/PLAN.md` (실행 instruction)
- `@Q/_migration-staging/CLASSIFICATION.md` (source→dest 매핑)

## Outputs
- 새 레포에 콘텐츠 이전 완료 (분류표대로)
- `CHANGELOG-migration.md` — 변경 요약 (이동 파일 수, 치환 수 등)

## 절대 규칙
1. **vault 원본 read-only**: `cp`만, `mv`/`rm` 금지
2. **PLAN.md에 없는 작업 금지**: 임의 판단으로 추가 작업 하지 말 것
3. **불확실하면 멈춤**: PLAN.md 모호한 부분은 작업 중단 후 사용자에게 확인

## Instructions

### 1. PLAN.md, CLASSIFICATION.md 로드
두 파일 모두 읽고 작업 목록 추출.

### 2. 파일 복사
CLASSIFICATION.md의 source→destination 매핑대로 복사.

### 3. 경로/wikilink 치환
PLAN.md의 치환 규칙 적용. 복사된 새 파일에 대해서만.

### 4. frontmatter 정규화
PLAN.md의 보존/제거 필드 룰 적용.

### 5. 변경 요약
`CHANGELOG-migration.md`에:
- 이동 파일 수
- 치환 위치 수
- frontmatter 정규화 영향 파일 수
- 의심스러웠던 항목 (있으면)

## Success Criteria
- 새 레포에 분류표 B 항목 모두 이전됨
- vault 원본 변경 없음 (`git status`로 vault 쪽 확인)
- CHANGELOG-migration.md에 변경 요약 존재

## 다음
완료 후 capable 모델(Phase 4a) 진입.
