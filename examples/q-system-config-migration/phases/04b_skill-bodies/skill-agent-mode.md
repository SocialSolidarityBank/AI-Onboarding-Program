# Skill 본문 작성: agent-mode

## Target
`.claude/skills/agent-mode/SKILL.md` 본문

## Source
- Phase 1 분류표에서 "agent_mode" 또는 "agent" 관련 원본 파일들

## Goal
agent_mode frontmatter 필드 값과 각 모드별 동작 정의를 SKILL.md 본문에 정리.

## Instructions
1. SKILL.md 열고 frontmatter 아래 본문 영역 확인
2. source 파일 읽고 다음 구조로 본문 작성:
   - 가능한 agent_mode 값 enum 목록
   - 각 모드의 의미 + 트리거 조건
   - 모드별 허용/금지 동작
   - 다른 frontmatter 필드와의 상호작용 (있으면)
3. 표 형식 권장 (모드 / 의미 / 동작 / 예시)

## 절대 규칙
- frontmatter 수정 금지
- source에 없는 모드 추가 금지
- 불확실: `<!-- TODO -->`

## Success Criteria
- "이 노트의 agent_mode는 X인데 어떻게 처리해야 해?" 질문에 이 skill로 답 가능
