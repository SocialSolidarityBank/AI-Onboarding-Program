# Skill 본문 작성: archive-policy

## Target
`.claude/skills/archive-policy/SKILL.md` 본문

## Source
- Phase 1 분류표에서 "archive" 관련 원본 파일들 (`99_ARCHIVE/KEEP/`, `99_ARCHIVE/TO-DELETE/` 정책)

## Goal
아카이브 정책 (KEEP vs TO-DELETE 분기, 보관 기간, 삭제 기준)을 SKILL.md 본문에 정리.

## Instructions
1. SKILL.md 열고 frontmatter 아래 본문 영역 확인
2. source 파일 읽고 다음 구조로 작성:
   - KEEP vs TO-DELETE 분기 기준
   - 각 분기별 위치 (vault, NAS, GitHub 별로 다른지)
   - 보관 기간 (TO-DELETE에서 영구 삭제까지)
   - 아카이브 트리거 조건 (어떤 상태일 때 아카이브)
   - 복구 방법 (실수 삭제 대비)
3. flowchart 또는 결정 트리 권장

## 절대 규칙
- frontmatter 수정 금지
- source에 없는 정책 추가 금지
- 불확실: `<!-- TODO -->`

## Success Criteria
- "이 파일 아카이브해야 하는데 KEEP이야 TO-DELETE야?" 질문에 이 skill로 답 가능
