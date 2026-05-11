# Phase 1: 분류 & 설계

## Agent
- **Model**: Sonnet 4.6 또는 Opus 4.7 (capable)
- **Tool**: Claude Code, vault root에서 시작
- **병렬**: × (단일 세션)

## Depends on
- 없음 (시작점)

## Goal
vault `Q/90_SYSTEM/`을 분류하고 후속 phase가 그대로 실행할 수 있는
plan 문서를 produce.

## Inputs
- `Q/90_SYSTEM/` 전체
- 사전 결정값 (README.md 참조)

## Outputs
vault 작업 영역에 생성:
1. `Q/_migration-staging/CLASSIFICATION.md` — 분류표
2. `Q/_migration-staging/STRUCTURE.md` — 새 레포 디렉토리 트리
3. `Q/_migration-staging/PLAN.md` — Phase 3 cheap 모델용 instruction
4. `Q/_migration-staging/SKILL-LIST.md` — Phase 4a 입력용 skill 후보 목록

## Instructions

### 1. Inventory
`Q/90_SYSTEM/` 전수 훑고 각 파일에 대해:
- 파일 경로
- frontmatter `type` (있으면)
- 한 줄 요약

### 2. 3분류
- **A. AGENTS.md감**: universal — 시스템 정체성, 핵심 운영 원칙. 슬림(10–30줄).
- **B. SKILL.md감**: 프로시저 — 워크플로우, agent_mode, INBOX, frontmatter 등. 독립 description 가능해야 함.
- **C. 노트감**: vault 잔류 — 회의록, 일지, 실험 기록.

`CLASSIFICATION.md` 형식:
```
| 원본 경로 | 분류 | 새 위치 | 비고 |
|---|---|---|---|
| 90_SYSTEM/workflow.md | B | .claude/skills/workflow-6stage/SKILL.md | |
```

### 3. 새 레포 트리 (`STRUCTURE.md`)
디렉토리 트리 + 각 디렉토리 1줄 목적 설명.

### 4. PLAN.md (Phase 3용)
cheap 모델이 추가 질문 없이 실행 가능하도록:
- source → destination 절대 경로 매핑
- 경로/wikilink 치환 규칙
- frontmatter 정규화 규칙 (보존/제거 필드)
- **vault 원본은 read-only** 명시 (`cp`만, `mv` 금지)

### 5. SKILL-LIST.md (Phase 4a용)
B로 분류된 것들의 skill 후보 목록 — 이름·description 라인 초안.

## Success Criteria
- 분류표에 모든 90_SYSTEM 파일 등재 (누락 0)
- PLAN.md만 보고 cheap 모델이 추가 질문 없이 실행 가능
- 본인이 분류표 검토 후 OK → Phase 2 진입

## 컨텍스트 관리
vault 분량 따라 길어질 수 있음. 60% 넘기 전 compact.
