# q-harness 재설계 (2026-05-11)

## 목적

q-harness를 **재사용 가능한 GitHub Template 레포**로 다듬는다. 현재는 q-system-config 마이그레이션 1회용으로 작성된 상태. 새 프로젝트(마이그레이션·신규 개발·리팩토링 등)에 동일 방법론을 적용할 수 있게 일반화한다.

## 핵심 결정

| # | 결정 | 채택안 | 비채택 |
|---|---|---|---|
| 1 | 적용 방식 | GitHub Template 레포 | clone 후 수정 / 스크립트 |
| 2 | q-system-config 내용 처리 | `examples/` 보존 + `phases/` 일반화 | 통째 일반화 / 통째 폐기 |
| 3 | Phase 구성 | 패턴만 표준화, phase 개수·이름 자유 | 6단계 고정 / 시나리오 프리셋 |
| 4 | 작성 도구 | 빈 템플릿 파일 (`templates/phase.md`) | 문서만 / 생성 스크립트 |
| 5 | Entry point | `README.md` + `SETUP.md` 분리 | README 통합 / 시나리오별 분기 |
| 6 | CLAUDE.md | `AGENTS.md` 심볼릭 링크 | 별도 유지 |

## 레포 구조

```
q-harness/  (GitHub Template repo)
├── README.md              # 하네스 소개 (what/why)
├── SETUP.md               # 새 프로젝트 적용 가이드 (how)
├── AGENTS.md              # 도구 중립 baseline (canonical)
├── CLAUDE.md              # → AGENTS.md (symlink)
├── docs/
│   └── PHASE-FORMAT.md    # phase 파일 포맷 상세 명세
├── templates/
│   └── phase.md           # 빈 phase 템플릿
├── phases/                # 비어있음 (.gitkeep)
└── examples/
    └── q-system-config-migration/
        ├── README.md
        └── phases/        # tar.gz 풀어 원본 보존
```

삭제 대상:
- `migration-tasks.tar.gz` (examples/로 풀고 폐기)
- 루트 `agents-md-and-repo.md`, `codex-compat.md`, `design-skills.md`, `hermes-compat.md` (examples/ 내부와 중복)

## Phase 파일 포맷

`templates/phase.md` (슬림):

```markdown
# Phase {{N}}: {{Phase Name}}

## Agent
- **Model tier**: capable | cheap
- **Tool**: {{tool}}
- **Parallel**: yes | no

## Depends on
-

## Goal


## Inputs


## Outputs


## Instructions


## Success Criteria
- [ ]

## Notes
```

설계 원칙:
- **Model tier 2단계만** (`capable` / `cheap`) — 모델명 박지 않음 (시간 지나면 바뀜)
- **Tool 도구 중립** — "Claude Code" 대신 능력 기준 표현 ("agentic CLI with file write")
- **Parallel 명시** — 같은 phase 폴더 내 병렬 실행 가능 여부
- **인라인 주석 없음** — 토큰 절약, 상세는 `docs/PHASE-FORMAT.md` 참조

## SETUP.md 흐름 (6단계)

1. **레포 생성** — GitHub "Use this template" → 새 private 레포 → 클론
2. **정체성 정의** — `AGENTS.md` 수정 (운영자·목적·핵심 원칙). 도구 이름 0회 검증
3. **Phase 구성 설계** — 시나리오에 맞춰 phase 개수·이름 결정. `examples/` 참고
4. **Phase 파일 작성** — `templates/phase.md` 복사해 채움. 막히면 `docs/PHASE-FORMAT.md` 참조
5. **검증** — depends on 경로 실재 / parallel 의존성 / 도구 이름 grep 0건
6. **실행** — 의존성 그래프 따라 phase 순차 위임

## 일관성 검증

- [x] 결정 3 (phase 자유) ↔ 결정 5 (시나리오별 분기 안 함) — 일관
- [x] 결정 4 (빈 템플릿) ↔ 결정 3 (시나리오 프리셋 안 함) — 일관 (둘 다 over-engineering 회피)
- [x] CLAUDE.md = AGENTS.md symlink → 하네스가 자기 컨벤션을 자기 자신에게 적용 (self-demonstrating)

## 비스코프

- 프리셋(`presets/migration/` 등) — 사용 패턴 안정 후 추출
- 생성 스크립트(`scripts/new-phase.sh`) — 빈 템플릿 복사가 충분
- 자동 의존성 그래프 시각화 — 수동 관리로 충분 (phase 수 적음)

## 다음 단계

이 design doc 확정 후 implementation plan 작성 → 실제 파일 재배치·작성·삭제 실행.
