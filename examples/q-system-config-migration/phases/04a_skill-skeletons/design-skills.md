# Phase 4a: Skill 골격 설계

## Agent
- **Model**: Sonnet 4.6 (capable)
- **Tool**: Claude Code, `~/Code/q-system-config`
- **병렬**: ×

## Depends on
- Phase 1: `Q/_migration-staging/SKILL-LIST.md`
- Phase 3: `.claude/skills/<name>/` 디렉토리들 (Phase 3에서 골격까지 만들어졌을 수도, 빈 SKILL.md만 있을 수도)

## Goal
각 skill의 **`description` 라인 정교화** + 구조 결정. 트리거 정확도가 여기서 결정됨.

## Skill 포맷 — 도구 호환

SKILL.md는 **open agent skills 스펙**(Linux Foundation Agentic AI Foundation 관리)을 따릅니다. 현재 지원:
- ✅ Claude Code (네이티브)
- ✅ opencode (네이티브, 동일 포맷)
- ✅ Codex CLI (2025-12부터 네이티브)
- ⚠️ 기타 도구는 미지원 — AGENTS.md만 fallback

**디렉토리 위치**: `.claude/skills/<name>/SKILL.md`
- Claude Code/opencode 표준
- Codex가 자동 인식 못 하면 `.codex/skills/`로 symlink 추가 (Phase 5의 codex-compat에서 확인)

## Inputs
- `Q/_migration-staging/SKILL-LIST.md`
- `.claude/skills/` 현재 상태

## Outputs
각 skill 폴더에 SKILL.md frontmatter + 구조 (본문은 비워두거나 골격만):
```yaml
---
name: workflow-6stage
description: 6단계 작업 워크플로우(INBOX→DRAFT→...) 정의. 새 작업 시작/단계 전환/현재 위치 확인 시 로딩.
---

# Workflow 6-Stage
[Phase 4b가 채울 본문 영역]
```

## Instructions

### 1. skill 후보 검토
SKILL-LIST.md 보고 다음 판단:
- 너무 잘게 쪼개진 것 → 합치기
- 너무 광범위한 것 → 쪼개기
- **각 skill은 독립적**: 다른 skill 안 읽어도 자기 책임 영역에서 답 가능해야 함

### 2. description 작성 — 트리거 우선
HumanLayer/Anthropic/agent skills 스펙 권장: description은 **검색 쿼리처럼**.
실제 사용자가 쓸 트리거 표현 포함:
- 좋은 예: "6단계 워크플로우 정의. 새 작업 시작·단계 전환·현재 위치 파악 시 사용."
- 나쁜 예: "워크플로우 관련 정보."

**도구 중립**: description에도 "Claude가…", "이 모델이…" 같은 표현 금지.

### 3. SKILL.md 골격 생성
각 skill에:
- frontmatter (`name`, `description` — open agent skills 스펙 필수 필드)
- 본문 빈 섹션 헤더만 (본문은 4b가 채움)
- 4b가 참조할 source 파일 경로 메모 (`<!-- source: 90_SYSTEM/workflow.md -->`)

### 4. 04b용 instruction 업데이트
`migration-tasks/04b_skill-bodies/` 폴더의 파일들을 4a 결정 결과에 맞게 본인이 직접 조정 (이름·개수 변경).

## Success Criteria
- 각 skill의 description이 검색 쿼리처럼 동작 가능
- skill 간 책임 중복 없음
- 4b가 본문만 채우면 끝나는 상태
- 모든 SKILL.md frontmatter가 open agent skills 스펙 따름

## 컨텍스트
skill description은 모든 세션에 들어감. 짧고 정확하게.

## 참고
- open agent skills 스펙: agents.md
- Codex 스킬 가이드: developers.openai.com/codex/changelog (2025-12-19 항목)
