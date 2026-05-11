# Review: Hermes 호환 테스트

## Agent
- **Model**: Sonnet 4.6 (분석용 capable) + Hermes (피검증 대상)
- **Tool**: Hermes 앱 (실세션) + Claude Code (분석)
- **병렬**: 05a 다른 파일들과 동시 가능

## ⚠️ 사용자 입력 필요
Hermes는 개인 앱이라 통합 방식이 케이스별로 다름. 본인이 다음 항목을 먼저 채워주세요:

```yaml
# Hermes 통합 정보 (본인이 채움)
hermes_version: "v2026.4.30"
hermes_reads_files: true | false   # 파일 시스템 직접 읽기 가능 여부
hermes_config_path: "..."           # 설정 파일 경로 (있으면)
hermes_context_injection: "..."     # 어떻게 컨텍스트를 받는가
                                    #   (예: 시스템 프롬프트 / 파일 읽기 / API 호출)
hermes_invocation: "..."            # 어떻게 호출하는가 (CLI / 앱 / API)
```

이 값들에 따라 검증 방식이 갈립니다.

## 분기별 검증

### Case A: Hermes가 파일 시스템 직접 읽기 가능
(`hermes_reads_files: true`)

#### Test A1: AGENTS.md 인식
Hermes 세션에서:
```
~/Code/q-system-config/AGENTS.md 읽고 이 레포 운영자와 목적 요약해줘.
```
Pass 조건: AGENTS.md 내용 정확히 반영된 답.

#### Test A2: 스킬 디렉토리 활용
```
.claude/skills/ 안에 어떤 스킬들이 있는지 목록과 각각의 description 출력해줘.
```
Pass 조건: 모든 스킬 발견.

### Case B: Hermes가 시스템 프롬프트로만 컨텍스트 받음
(`hermes_reads_files: false`)

#### 브리지 필요
AGENTS.md 내용을 Hermes 시스템 프롬프트에 주입하는 메커니즘 필요.
옵션:
1. **수동 동기화**: AGENTS.md 변경 시 Hermes 설정에 복사
2. **자동 동기화 스크립트**: `scripts/sync-agents-md-to-hermes.sh` (cron/launchd로 주기 실행)
3. **API 통합**: Hermes가 OpenRouter/Claude API 사용한다면, AGENTS.md를 system 메시지로 자동 첨부

#### Test B1: 동기화 후 인식
브리지 적용 후 Hermes 세션에서:
```
이 시스템 운영자 누구고 핵심 운영 원칙이 뭐야?
```
Pass 조건: AGENTS.md 내용 반영된 답.

### Case C: Hermes는 별개 도메인 (canon과 무관)
(`hermes_reads_files: false` + 통합 불필요)

이 경우 검증 생략. 다만 Hermes가 canon repo 내용을 알아야 할 시점이 미래에 생기면 Case B로 전환.

## Output
`migration-tasks/_review/hermes-compat-result.md`:
- 본인이 입력한 통합 정보
- 적용 Case (A/B/C)
- Test 결과
- 브리지 필요 시 후속 액션 명시

## 후속 액션 예시 (Case B 적용 시)

`scripts/sync-agents-md-to-hermes.sh` (예시):
```bash
#!/bin/bash
# AGENTS.md를 Hermes 시스템 프롬프트로 동기화
HERMES_PROMPT_PATH="..."  # 본인 환경 경로
cp ~/Code/q-system-config/AGENTS.md "$HERMES_PROMPT_PATH/canon-context.md"
# 또는 Hermes 재시작 트리거
```

cron 등록:
```cron
0 */6 * * * ~/Code/q-system-config/scripts/sync-agents-md-to-hermes.sh
```

## 참고
- Hermes의 통합 인터페이스가 표준 AGENTS.md를 지원하지 않는다면, 위 브리지가 유일한 호환 경로.
- 장기적으로 Hermes에 AGENTS.md 직접 읽기 기능을 추가하는 것이 가장 깔끔.
