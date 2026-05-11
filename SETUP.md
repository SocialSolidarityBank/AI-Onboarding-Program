# SETUP — 새 프로젝트에 적용

[English → SETUP.en.md](SETUP.en.md)

---

q-harness를 받아 새 프로젝트로 만드는 6단계 가이드.

## 1. 레포 생성

GitHub 이 레포 페이지(`q-harness`) 우상단 **"Use this template"** 버튼 → **Create a new repository** → 이름 입력(예: `my-project`) → Private 권장 → Create.

```bash
git clone https://github.com/<your-username>/my-project
cd my-project
```

## 2. 정체성 정의 (AGENTS.md)

`AGENTS.md`를 프로젝트에 맞게 수정합니다. 채워야 할 것:

- **Operator** — 누가 이 레포를 운영하는가 (1-2줄)
- **Purpose** — 이 레포가 무엇을 위한 것인가 (1줄)
- **Core Principles** — 모든 작업에 적용되는 원칙 1-3개

**금지 사항**:
- 도구 고유명사 ("Claude Code", "opencode" 등) 직접 박지 말 것
- 도구 특정 기능("/compact 명령어로...") 의존하지 말 것
- 구체 워크플로우는 phase brief나 별도 문서로 분리

검증:
```bash
grep -i "claude code\|opencode\|cursor\|codex" AGENTS.md
# 0건이어야 함
```

`CLAUDE.md`는 `AGENTS.md` 심볼릭 링크라 자동 반영됩니다 (별도 작업 불필요).

## 3. Phase 구성 설계

프로젝트가 어떤 phase가 필요한지 결정합니다. **phase 개수·이름은 자유.**

판단 가이드:

| 시나리오 | 일반적 phase 구성 |
|---|---|
| 마이그레이션 | design → scaffold → migrate → review → cleanup (5-8개) |
| 신규 기능 | design → impl → test → review (3-4개) |
| 리팩토링 | analyze → plan → refactor → verify (4개) |
| 단순 작업 | brief 1개로 충분, phase 폴더 없이 가능 |

`examples/q-system-config-migration/phases/`를 펼쳐서 비슷한 시나리오를 참고하세요.

폴더 명명 규칙:
- 숫자 prefix로 의존성 표시: `01_design/`, `02_scaffold/`, ...
- 같은 단계 내 분기는 letter: `04a_skeletons/`, `04b_bodies/`
- 파일명은 작업 내용을 짧게: `classify-and-plan.md`, `execute-migration.md`

## 4. Phase 파일 작성

각 phase 폴더 만들고 빈 양식 복사:

```bash
mkdir -p phases/01_design
cp templates/phase.md phases/01_design/plan.md
```

`phases/01_design/plan.md`를 열어 채웁니다:

```markdown
# Phase 1: Design

## Agent
- **Model tier**: capable
- **Tool**: agentic CLI with file read/write
- **Parallel**: no

## Depends on
- (none — 첫 phase)

## Goal
프로젝트 전반의 분류표와 구조 설계도 작성.

## Inputs
- `docs/requirements.md`

## Outputs
- `phases/_artifacts/CLASSIFICATION.md`
- `phases/_artifacts/STRUCTURE.md`

## Instructions
1. requirements.md 읽고 작업 단위 분류
2. ...

## Success Criteria
- [ ] CLASSIFICATION.md 모든 항목이 A/B/C 중 하나로 라벨됨
- [ ] STRUCTURE.md가 실제 파일 경로로 작성됨

## Notes
```

각 필드 의미가 헷갈리면 `docs/PHASE-FORMAT.md` 참조.

## 5. 검증

푸시·실행 전 체크:

```bash
# AGENTS.md 도구 중립 검증
grep -i "claude code\|opencode\|cursor\|codex" AGENTS.md && echo "FAIL" || echo "OK"

# 모든 phase brief에 필수 섹션 있는지
for f in phases/**/*.md; do
  grep -q "## Agent" "$f" || echo "MISSING Agent: $f"
  grep -q "## Goal" "$f" || echo "MISSING Goal: $f"
  grep -q "## Success Criteria" "$f" || echo "MISSING SC: $f"
done

# Depends on 경로 실재 (수동 확인)
grep -r "Depends on" phases/ -A 5
```

`git status` 깨끗한지, 의도치 않은 파일 없는지 확인.

## 6. 실행

각 phase brief를 에이전트에 위임:

```
사용자 → 에이전트:
"이 brief대로 작업해줘. 완료 후 Success Criteria 모두 체크해줘.
@phases/01_design/plan.md"
```

의존성 그래프 따라:
- 선행 phase 완료 후 다음 phase 시작
- 같은 phase 내 `Parallel: yes` brief들은 동시 위임 가능
- `Parallel: no`는 순차 실행

검증 phase(보통 마지막 phase 직전)가 PASS한 후에만 외부 publish (git push, deploy 등).

---

## 자주 묻는 질문

**Q. phase가 1개뿐이어도 되나요?**
A. 네. 단순 작업은 brief 1개로 충분합니다. phase 폴더 구조는 작업이 여러 단계로 나뉠 때만 의미 있습니다.

**Q. examples/는 지워도 되나요?**
A. 네, 새 프로젝트에서는 지워도 됩니다. 다만 첫 phase 설계 때 참고 가치가 있어 보통 유지합니다.

**Q. CLAUDE.md를 직접 수정해도 되나요?**
A. 안 됩니다. `AGENTS.md`만 수정하세요. CLAUDE.md는 심볼릭 링크라 자동 반영됩니다.

**Q. Codex/opencode가 `.claude/skills/`를 못 찾으면?**
A. `.codex/skills`, `.opencode/skills` 같은 심볼릭 링크 추가. 자세한 내용은 `examples/q-system-config-migration/phases/05a_review-capable/codex-compat.md` 참조.
