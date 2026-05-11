# Example: q-system-config Migration

> **이 폴더는 q-harness 적용 사례 1번** — Obsidian vault(`~/Library/Mobile Documents/.../Q/`)를
> GitHub private 레포 `q-system-config`로 마이그레이션하기 위해 작성된 phase brief 모음입니다.
> 새 프로젝트는 이 구성을 그대로 쓰지 말고 **참고만** 하세요.
> Phase 개수·이름·도구 선택은 프로젝트 성격에 따라 다릅니다.
>
> *This folder is example #1 of q-harness in action — phase briefs for migrating an
> Obsidian vault into a private GitHub repo `q-system-config`. New projects should
> **reference** this, not copy it wholesale. Phase count, naming, and tool choice
> depend on the project's nature.*

---

각 폴더 = 하나의 에이전트 타입에 위임.
**같은 폴더 안 마크다운은 병렬 실행 가능**, 폴더 간에는 의존성 따라 순차 실행.

## 멀티 에이전트 설계 원칙

이 정본은 **특정 에이전트에 묶이지 않게** 설계됩니다:

- **AGENTS.md**: 보편 표준 (Claude Code/opencode/Codex/Cursor/Aider 모두 지원). 모든 에이전트의 baseline.
- **SKILL.md** (open agent skills 스펙): Claude Code/opencode/Codex 지원. 보강 레이어.
- **CLAUDE.md**: Anthropic 호환용 — AGENTS.md로의 symlink로 처리 (drift 0).
- **Hermes** 등 개인/특수 에이전트: 파일 읽기 가능하면 그대로, 아니면 브리지 스크립트.

→ AGENTS.md만 보고도 에이전트가 일할 수 있어야 함. 스킬은 "있으면 좋은" 추가 컨텍스트.

## 의존성 그래프

```
01_design (capable)
   └→ 02_scaffold (capable)
        └→ 03_migrate (cheap)
             └→ 04a_skill-skeletons (capable)
                  └→ 04b_skill-bodies/* (cheap, 병렬)
                       ├→ 05a_review-capable/* (capable, 병렬) ┐
                       └→ 05b_review-cheap/*   (cheap, 병렬)   ┴→ push
                            └→ 06_cleanup (cheap)
```

05a와 05b는 **동시 시작 가능** (서로 의존 없음).

## 폴더별 에이전트 매핑

| 폴더 | 모델 | 도구 | 병렬 | 파일 수 |
|---|---|---|---|---|
| `01_design/` | Sonnet 4.6 또는 Opus 4.7 | Claude Code | × | 1 |
| `02_scaffold/` | Sonnet 4.6 | Claude Code | × | 1 |
| `03_migrate/` | Kimi K2 (OpenRouter) | opencode (yolo) | × | 1 |
| `04a_skill-skeletons/` | Sonnet 4.6 | Claude Code | × | 1 |
| `04b_skill-bodies/` | Kimi K2 | opencode (yolo) | ○ | 5 (조정 가능) |
| `05a_review-capable/` | Sonnet 4.6 + 검증 대상 에이전트 | Claude Code + Codex/opencode/Hermes | ○ | **5** |
| `05b_review-cheap/` | Kimi K2 | opencode | ○ | 2 |
| `06_cleanup/` | Kimi K2 | opencode | × | 1 |

## 05a 검증 대상 에이전트 (5개 병렬)

| 파일 | 검증 대상 | 노트 |
|---|---|---|
| `agents-md-adequacy.md` | (모든 에이전트 공통) | AGENTS.md 자체 적합성 |
| `skill-trigger-test.md` | Claude Code | SKILL.md 트리거 정확도 |
| `opencode-compat.md` | opencode | symlink로 호환 |
| `codex-compat.md` | Codex CLI | AGENTS.md/SKILL.md 네이티브, 스킬 경로만 확인 |
| `hermes-compat.md` | Hermes | 개인 앱 — 통합 방식에 따라 분기 |

## 실행 메모

- **04b 폴더의 파일 이름·개수는 Phase 1의 `CLASSIFICATION.md` 확정 후 조정**. 현재는 메모리 기반 추정 5개.
- Phase 5 모든 파일 PASS 후에만 Phase 6 실행. 그 전에는 vault 정본 살아있음 → 롤백 안전.
- `git push`는 **05b/security-scan 통과 확인 후**에만.

## 사전 결정값 (모든 phase 공통 입력)

```
새 레포명:    q-system-config
GitHub:       private
로컬 경로:    ~/Code/q-system-config
skill 위치:   .claude/skills/  (Codex/opencode는 이 경로 호환 또는 symlink)
vault 경로:   /Users/seongqkim/Library/Mobile Documents/iCloud~md~obsidian/Documents/Q/
```

## 실행 패턴 예시

```bash
# Phase 1 시작 (capable)
cd ~/Library/Mobile\ Documents/.../Q/
claude
> @migration-tasks/01_design/classify-and-plan.md 따라 진행해

# Phase 4b 병렬 위임 (cheap, 5개 동시)
cd ~/Code/q-system-config
for f in migration-tasks/04b_skill-bodies/skill-*.md; do
  opencode -m kimi-k2 --yolo --task "$f" &
done
wait

# Phase 5a 병렬 검증 (각 검증은 다른 도구 세션 필요)
# agents-md-adequacy, skill-trigger-test → Claude Code 새 세션
# opencode-compat → opencode 세션
# codex-compat → codex 세션
# hermes-compat → Hermes 앱
# 도구 분산이라 진짜 동시는 어렵고, 같은 시간대에 빠르게 돌리는 식
```
