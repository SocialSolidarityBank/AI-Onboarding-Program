# Skill 본문 작성: frontmatter-spec

## Target
`.claude/skills/frontmatter-spec/SKILL.md` 본문

## Source
- Phase 1 분류표에서 "frontmatter" 또는 "metadata" 관련 원본 파일들

## Goal
모든 노트의 frontmatter 표준 스펙을 SKILL.md 본문에 정리.

## Instructions
1. SKILL.md 열고 frontmatter 아래 본문 영역 확인
2. source 파일 읽고 다음 구조로 작성:
   - 필드 목록 (필수/선택)
   - 각 필드: 타입, 허용값, 의미, 예시
   - `type` 필드 enum (있으면 전체 값 목록)
   - `agent_mode` 필드는 별도 skill 참조로 링크 (`agent-mode` skill 참조)
   - 검증 규칙 (있으면)
3. 표 권장 (필드 / 타입 / 필수 / 허용값 / 예시)

## 절대 규칙
- frontmatter 수정 금지 (이 SKILL.md 자체의 frontmatter)
- source에 없는 필드 추가 금지
- agent_mode 상세는 별도 skill에 위임 (참조만)
- 불확실: `<!-- TODO -->`

## Success Criteria
- 새 노트 만들 때 "어떤 frontmatter 써야 해?" 질문에 이 skill로 답 가능
