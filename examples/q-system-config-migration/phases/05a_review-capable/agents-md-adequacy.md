# Review: AGENTS.md 적합성

## Agent
- **Model**: Sonnet 4.6 (capable)
- **Tool**: Claude Code, **빈 컨텍스트 새 세션**, `~/Code/q-system-config`
- **병렬**: 05a 다른 파일들과 동시 가능

## Goal
빈 컨텍스트 세션이 AGENTS.md만 보고 시스템 정체성·운영 원칙을 파악할 수 있는지 검증.

## Procedure

### Test 1: 정체성 인식
프롬프트:
```
이 레포가 뭐고 운영자가 누군지 한 단락으로 설명해줘.
다른 파일 읽지 말고 자동으로 들어온 컨텍스트만 써.
```

**Pass 조건**:
- 사회연대은행 PM이 OPS 정본을 관리하는 레포라는 점이 정확히 나옴
- vault와의 관계 인식

### Test 2: 슬림성
AGENTS.md 줄 수 카운트.
- **Pass**: 30줄 이하
- **Warn**: 30–50줄 (압축 검토 권장)
- **Fail**: 50줄 초과 (skill로 분리해야 할 내용 섞임)

### Test 3: 책임 분리
프롬프트:
```
이 시스템의 6단계 워크플로우 1단계가 뭐야?
```

**Pass 조건**:
- AGENTS.md만으로는 못 답하고, workflow-6stage skill을 참조하라고 안내
- (만약 답이 나오면 AGENTS.md에 워크플로우가 들어가 있다는 뜻 → Fail)

## Output
`migration-tasks/_review/agents-md-adequacy-result.md`:
- 각 Test 결과 (Pass/Warn/Fail)
- 발견된 문제 + 수정 제안

## Failure 시
AGENTS.md 수정 후 같은 테스트 재실행. capable 모델로 직접 수정.
