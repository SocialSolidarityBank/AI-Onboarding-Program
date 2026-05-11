# Review: Codex 호환 테스트

## Agent
- **Model**: Sonnet 4.6 또는 Opus 4.7 (분석용 capable)
- **Tool**: Codex CLI (실세션) + Claude Code (분석)
- **병렬**: 05a 다른 파일들과 동시 가능

## Background
Codex CLI는 다음을 네이티브 지원:
- **AGENTS.md** 읽기 (글로벌 `~/.codex/AGENTS.md` + 프로젝트 루트 `AGENTS.md` 체인)
- **SKILL.md** 읽기 (open agent skills 스펙, 2025-12 추가)
- 스킬 명시 호출: `$skill-name`

따라서 우리 레포는 추가 설정 없이 작동해야 함. 이 테스트는 그 가정을 검증.

## Pre-check
```bash
codex --version  # 최신 권장: codex update
ls ~/.codex/AGENTS.md 2>/dev/null && echo "global AGENTS.md exists"
```
글로벌 AGENTS.md가 있으면 우리 레포 AGENTS.md와 충돌 가능성 확인 필요.

## Procedure

### Test 1: AGENTS.md 인식
```bash
cd ~/Code/q-system-config
codex
```
프롬프트:
```
이 레포 운영자 누구고 목적이 뭐야? AGENTS.md 본 내용으로만 답해줘.
```
**Pass 조건**: Claude Code/opencode 응답과 본질적으로 동일.

### Test 2: 스킬 디렉토리 발견
Codex의 스킬 발견 경로가 `.claude/skills/`와 다를 수 있음. 확인:
```bash
codex --help | grep -i skill
# 또는 Codex 세션에서
> $list-skills  (가능하면)
```
- 만약 Codex가 `.claude/skills/` 자동 인식 → OK
- 인식 못 하면: 추가 작업 필요 — 옵션 두 가지
  - **A. 심볼릭 링크 추가**: `ln -s .claude/skills .codex/skills`
  - **B. Codex `project_doc_fallback_filenames` 설정**으로 skill 경로 추가

### Test 3: 스킬 트리거
Codex 세션에서:
```
6단계 워크플로우 1단계가 뭐야?
```
**Pass 조건**: workflow-6stage 스킬이 트리거되어 답이 나옴.
**Fail 시**: Test 2의 디렉토리 발견 문제 — A 또는 B 적용 후 재시도.

### Test 4: 글로벌 override 충돌
`~/.codex/AGENTS.md`가 있다면 그 내용이 프로젝트 AGENTS.md와 충돌하지 않는지:
```bash
cat ~/.codex/AGENTS.md 2>/dev/null
```
충돌 발견 시 `~/.codex/AGENTS.override.md`로 임시 비우거나 정렬.

## Output
`migration-tasks/_review/codex-compat-result.md`:
- Codex 버전
- 글로벌 AGENTS.md 존재 여부 + 충돌 여부
- Test 1–4 결과
- 스킬 경로 호환을 위한 후속 액션 (A/B 중 선택)
- 동등성 판정 (Claude Code 응답 vs Codex 응답)

## 후속 액션 (Test 2 Fail 시)
**옵션 A — 심볼릭 링크 (권장, 단순)**:
```bash
cd ~/Code/q-system-config
mkdir -p .codex
ln -s ../.claude/skills .codex/skills
git add .codex && git commit -m "add codex skills symlink"
```

**옵션 B — Codex 설정**:
`~/.codex/config.toml`:
```toml
project_doc_fallback_filenames = [".claude/skills"]
```
(이건 정확한 키 확인 필요 — Codex 문서 최신 참조)

## 참고
- Codex AGENTS.md 가이드: developers.openai.com/codex/guides/agents-md
- Codex 스킬: 2025-12 추가, $skill-name 호출 가능
