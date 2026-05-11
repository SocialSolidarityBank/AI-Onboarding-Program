# Phase 2: AGENTS.md & 레포 골격

## Agent
- **Model**: Sonnet 4.6 (capable)
- **Tool**: Claude Code, `~/Code/q-system-config`
- **병렬**: ×

## Depends on
- Phase 1 산출물:
  - `Q/_migration-staging/CLASSIFICATION.md`
  - `Q/_migration-staging/STRUCTURE.md`

## Goal
빈 레포에 git init 후 root 문서 골격(AGENTS.md, CLAUDE.md symlink, README, .gitignore) 작성.
**AGENTS.md는 도구 중립적으로** — Claude Code, opencode, Codex, Cursor, Aider, 기타 모든 에이전트가 baseline으로 쓸 수 있어야 함.

## Pre-step (본인 직접 실행)
```bash
mkdir -p ~/Code/q-system-config && cd $_
git init
mkdir -p .claude/skills docs
```

## Outputs
1. `AGENTS.md` — universal context, 도구 중립, 슬림(10–30줄)
2. `CLAUDE.md` → `AGENTS.md` symlink
3. `README.md` — 레포 소개 (사람용, 도구 언급 가능)
4. `.gitignore` — Obsidian/macOS 노이즈 제외

## Instructions

### 1. AGENTS.md 작성 — 슬림 + 도구 중립
HumanLayer 권장 따름: linter처럼 만들지 말 것. universal한 것만.

**포함**:
- 운영자 정체성 (디자이너 출신 PM, 사회연대은행)
- 레포 목적 (OPS 정본)
- 모든 세션에 적용되는 핵심 운영 원칙 1–3개
- 추가 컨텍스트 위치 안내 ("워크플로우/INBOX/agent_mode 등 구체 절차는 스킬 참조 또는 docs/ 참조")

**배제 (중요)**:
- 구체 워크플로우 6단계 (→ skill)
- agent_mode 정의 (→ skill)
- INBOX 라우팅 룰 (→ skill)
- frontmatter 스펙 (→ skill)
- **특정 도구 이름** ("Claude Code에서…", "opencode 세션…" 같은 표현 금지)
- **Anthropic/OpenAI 특정 기능 의존** (예: "/compact 명령어로…" 금지)

도구 중립 검증: AGENTS.md를 Cursor 사용자가 처음 봐도 자기 도구로 작업 가능해야 함.

소스: Phase 1 분류표에서 **A로 분류된 것만**.

### 2. CLAUDE.md symlink
```bash
ln -s AGENTS.md CLAUDE.md
```
- Claude Code: CLAUDE.md 우선, symlink로 AGENTS.md 도달
- opencode: AGENTS.md 우선, CLAUDE.md fallback (symlink 무관)
- Codex: AGENTS.md 직접 읽음 (symlink 무관)
- 결과: 한 파일, 모든 도구 호환, drift 0

### 3. README.md (사람용 — 도구 언급 OK)
- 레포 목적 1단락
- 디렉토리 구조
- 도구별 세션 시작 예시 (Claude Code, opencode, Codex 모두)
- vault와의 관계

### 4. .gitignore
```
.DS_Store
.obsidian/workspace*
.obsidian/cache
*.swp
_migration-staging/
```

## Success Criteria
- AGENTS.md가 30초 안에 읽히고 "이 시스템 운영자가 누구고 어떻게 일하는지" 파악됨
- AGENTS.md 안에 도구 이름 0회 등장 (도구 중립)
- `ls -la` 시 `CLAUDE.md -> AGENTS.md` 확인됨
- `git status` 깨끗 (불필요 파일 안 잡힘)

## Push 안 함
이 phase에서는 commit만, push는 Phase 5 검수 후.
