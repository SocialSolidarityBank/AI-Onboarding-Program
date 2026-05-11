# Phase File Format / Phase 파일 포맷

Detailed spec for `phases/**/*.md` brief files.
`phases/**/*.md` brief 파일의 상세 명세.

---

## Required Sections / 필수 섹션

Every phase brief MUST contain these headers in this order.
모든 phase brief는 아래 헤더를 이 순서로 포함해야 합니다.

```
# Phase {{N}}: {{Name}}    ← H1, single line
## Agent                    ← H2
## Depends on
## Goal
## Inputs
## Outputs
## Instructions
## Success Criteria
## Notes                    ← optional, but include the header
```

## Field Specs / 필드 명세

### Model tier (`capable` / `cheap`)

Two tiers only — no model names.
모델명은 박지 않고 두 단계로만 표현.

| Tier | When to use / 언제 쓰나 |
|---|---|
| `capable` | design, code review, complex reasoning, security audit / 설계·리뷰·복잡 추론·보안 감사 |
| `cheap` | mechanical conversion, repetitive edits, link rewrites / 단순 변환·반복 편집·링크 재작성 |

Why no model names: model lineup changes every few months. Tiers stay stable.
모델명을 안 쓰는 이유: 라인업이 몇 달마다 바뀝니다. tier는 안정적.

### Tool

Describe by capability, not product.
제품명이 아닌 능력으로 표현.

| Bad / 나쁜 예 | Good / 좋은 예 |
|---|---|
| `Claude Code` | `agentic CLI with file read/write` |
| `opencode --yolo` | `agentic CLI with autonomous mode` |
| `Codex CLI` | `agentic CLI with AGENTS.md support` |
| `Cursor` | `IDE-integrated agent with workspace context` |

If a brief truly requires a specific tool feature (rare), name the capability and put the product as a parenthetical hint.
특정 도구 기능이 정말 필요하면 능력을 먼저 적고 도구는 괄호 힌트로.

Example: `agentic CLI with skill auto-discovery (e.g. Codex 2025-12+)`

### Parallel (`yes` / `no`)

Whether briefs in the **same phase folder** can run concurrently.
**같은 phase 폴더 안** 다른 brief와 동시 실행 가능 여부.

- `yes` — no shared output paths, no read-write conflicts on same files
- `no` — modifies state another brief in the same folder reads

Cross-phase parallelism is governed by `Depends on`, not this field.
Phase 간 병렬은 `Depends on`이 결정합니다 (이 필드 아님).

### Depends on

List artifact paths from upstream phases.
선행 phase가 만든 산출물 경로 나열.

```markdown
## Depends on
- `phases/01_design/_artifacts/CLASSIFICATION.md`
- `phases/02_scaffold/AGENTS.md`
```

If none: `- (none — first phase)`.
없으면: `- (none — first phase)`.

### Goal

1–3 sentences. What this phase produces and why.
1-3문장. 이 phase가 무엇을 왜 만드는지.

### Inputs / Outputs

Concrete file paths, not abstractions.
추상적 표현 금지. 실제 파일 경로.

| Bad / 나쁜 예 | Good / 좋은 예 |
|---|---|
| "the design doc" | `docs/design/api-v2.md` |
| "skill files" | `.claude/skills/workflow-6stage/SKILL.md` |

### Instructions

Step-by-step. Tool-neutral phrasing.
단계별. 도구 중립 표현.

| Bad / 나쁜 예 | Good / 좋은 예 |
|---|---|
| "Use Claude Code to read X" | "Read X" |
| "Run /compact when context fills" | "If context window fills, summarize and continue" |

### Success Criteria

Verifiable checklist. Each item must be objectively checkable.
검증 가능한 체크리스트. 각 항목은 객관적으로 확인 가능해야 함.

| Bad / 나쁜 예 | Good / 좋은 예 |
|---|---|
| "Code is clean" | "`npm run lint` exits 0" |
| "Docs are good" | "README.md contains §Quickstart and §FAQ" |

### Notes

Optional. Caveats, references, links to source material.
선택. 주의사항·참고·원본 링크.

---

## Anti-Patterns / 안티패턴

- ❌ Model names in `Model tier` (`Sonnet 4.6`, `gpt-4`) → use `capable` / `cheap`
- ❌ Tool products in `Tool` (`Claude Code`) → describe capability
- ❌ Tool-specific commands in `Instructions` (`/compact`, `$skill-name`) → describe behavior
- ❌ Vague `Success Criteria` ("works correctly") → use grep-able / runnable checks
- ❌ Brief that requires reading another brief to make sense → each brief is self-contained
- ❌ Cross-phase parallelism via `Parallel: yes` → that field only governs same-folder briefs

## Example / 예시

See `examples/q-system-config-migration/phases/04b_skill-bodies/skill-workflow-6stage.md` for a fully-filled brief.
완성된 brief 예시는 `examples/q-system-config-migration/phases/04b_skill-bodies/skill-workflow-6stage.md` 참조.
