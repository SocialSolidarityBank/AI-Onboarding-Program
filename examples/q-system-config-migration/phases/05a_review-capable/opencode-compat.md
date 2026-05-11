# Review: opencode 호환 테스트

## Agent
- **Model**: Sonnet 4.6 또는 Opus 4.7 (capable, 메타 분석)
- **Tool**: Claude Code (분석용) + opencode CLI (실세션)
- **병렬**: 05a 다른 파일들과 동시 가능

## Goal
같은 레포가 Claude Code와 opencode 양쪽에서 동일하게 동작하는지 검증.

## Background
- Claude Code: CLAUDE.md 우선 읽음
- opencode: AGENTS.md 우선, CLAUDE.md fallback
- Phase 2에서 `CLAUDE.md → AGENTS.md` symlink 했으므로 양쪽 호환되어야 함

## Procedure

### Test 1: symlink 무결성
```bash
cd ~/Code/q-system-config
ls -la CLAUDE.md
# expected: CLAUDE.md -> AGENTS.md
readlink CLAUDE.md
# expected: AGENTS.md
```

### Test 2: Claude Code 세션
```bash
claude
> 이 레포 운영자 누구야? AGENTS.md 또는 CLAUDE.md 본 내용으로만 답해줘.
```
응답 캡처.

### Test 3: opencode 세션 (같은 디렉토리)
```bash
opencode
> 이 레포 운영자 누구야? AGENTS.md 또는 CLAUDE.md 본 내용으로만 답해줘.
```
응답 캡처.

### Test 4: 비교
Test 2와 3의 응답이 본질적으로 동일해야 함 (표현 차이는 OK).

## Output
`migration-tasks/_review/opencode-compat-result.md`:
- symlink 상태
- Claude Code 응답
- opencode 응답
- 동등성 판정 (Pass/Fail)

## Failure 시
- symlink 깨짐 → 재생성 (`ln -sf AGENTS.md CLAUDE.md`)
- 응답 불일치 → AGENTS.md에 도구 의존적 표현 있는지 확인 후 제거

## 환경 메모
opencode 최신 버전 권장 (`opencode upgrade`).
opencode가 Claude Code 호환 모드 켜져 있는지 확인.
