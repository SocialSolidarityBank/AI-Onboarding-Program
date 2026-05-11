# q-harness

> 멀티 에이전트 작업을 phase 단위로 위임·실행하기 위한 재사용 가능한 하네스.
> *A reusable harness for delegating multi-agent work in phases.*

[English version → README.en.md](README.en.md)

---

## 한 줄 요약

새 프로젝트를 시작할 때 "여러 에이전트한테 일을 어떻게 나눌지"를 매번 처음부터 짜지 않도록, **작업 분배 패턴을 미리 정해둔 GitHub Template 레포**입니다.

## 왜 만들었나

여러 에이전트(Claude, Codex, opencode, Hermes 등)에 일을 나눠 시키다 보면 매번 같은 고민을 반복합니다.

- 어떤 작업을 capable 모델(Sonnet/Opus급)에 주고, 어떤 걸 cheap 모델(Kimi K2 등)에 주나
- 어떤 작업이 병렬 가능하고 어떤 게 순차인가
- 위임 지시서를 어떤 양식으로 쓰면 어떤 도구든 똑같이 이해하나

q-harness는 이 패턴을 **phase 폴더 + 표준 양식**으로 굳혀둔 틀입니다. 새 프로젝트는 이 틀을 그대로 받아서 자기 phase만 채우면 됩니다.

## 핵심 개념

| 개념 | 설명 |
|---|---|
| **Phase** | 작업 한 묶음. 폴더 하나(`phases/01_design/` 등) |
| **Brief** | phase 안의 마크다운 파일 하나. 에이전트 한 명에게 주는 작업 지시서 |
| **Model tier** | `capable` (설계·리뷰) / `cheap` (단순 변환·반복) — 모델명 박지 않음 |
| **Parallel** | 같은 phase 폴더 안에서 다른 brief와 동시 실행 가능 여부 |
| **Tool neutrality** | brief는 도구 이름("Claude Code") 대신 능력("agentic CLI with file write")으로 표현 |

## 레포 구조

```
q-harness/
├── README.md / README.en.md      이 파일
├── SETUP.md  / SETUP.en.md       새 프로젝트 적용 가이드
├── AGENTS.md                     모든 에이전트의 baseline (도구 중립)
├── CLAUDE.md → AGENTS.md         Anthropic 호환 심볼릭 링크
├── docs/
│   └── PHASE-FORMAT.md           phase 파일 포맷 상세 명세
├── templates/
│   └── phase.md                  빈 phase 양식 (복사해서 채움)
├── phases/                       비어있음 (새 프로젝트가 채움)
└── examples/
    └── q-system-config-migration/   실전 사례 (참고용)
        ├── EXAMPLE-NOTES.md
        └── phases/                  8단계 실제 brief 모음
```

## 빠른 시작

자세한 단계는 [SETUP.md](SETUP.md) 참조.

```
1. GitHub에서 "Use this template" 클릭 → 새 레포 생성
2. 클론 후 AGENTS.md 수정 (정체성·목적·원칙)
3. phases/ 폴더에 phase 폴더들 생성
4. cp templates/phase.md phases/01_xxx/yyy.md → 채움
5. 에이전트에 위임: "이 brief대로 작업해줘 → @phases/01_xxx/yyy.md"
```

## 비스코프 (안 하는 것)

- **시나리오별 프리셋** — phase 구성은 프로젝트마다 다르므로 미리 만들어두지 않음
- **생성 스크립트** — 빈 템플릿 파일 복사로 충분
- **자동 의존성 그래프 시각화** — phase 수가 적으니 수동 관리

## 참고 사례

`examples/q-system-config-migration/`은 실제로 이 하네스로 진행된 첫 프로젝트입니다 (Obsidian vault → GitHub 레포 마이그레이션, 8단계). 새 프로젝트가 phase 구성을 짤 때 참고할 수 있습니다.

## 라이선스

이 레포의 사용은 자유. 내부에 적힌 운영 원칙과 사례는 작성자(seongqkim) 본인의 작업 패턴이며, 강제 표준이 아닙니다.
