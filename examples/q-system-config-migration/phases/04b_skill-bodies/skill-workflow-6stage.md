# Skill 본문 작성: workflow-6stage

## Target
`.claude/skills/workflow-6stage/SKILL.md` 본문

## Source (CLASSIFICATION.md에서 확인)
- Phase 1 분류표에서 "workflow" 관련 원본 파일들
- 일반적으로 `90_SYSTEM/workflow.md` 또는 유사

## Goal
6단계 워크플로우 정의를 SKILL.md 본문으로 정리.

## Instructions
1. SKILL.md 열고 frontmatter 아래 본문 영역 확인
2. source 파일(들) 읽고 다음 구조로 본문 작성:
   - 6단계 각각의 이름 + 한 줄 정의
   - 단계 간 전이 조건
   - 각 단계 입력/산출물
   - 전형적 frontmatter `type` 값과 단계 매핑 (있으면)
3. 마크다운 위계 정돈 (H2: 단계명, H3: 세부)

## 절대 규칙
- frontmatter 수정 금지
- source에 없는 단계·규칙 추가 금지
- 불확실: `<!-- TODO -->` 표시

## Success Criteria
- 빈 컨텍스트 새 세션에서 "워크플로우 어떻게 돼?" 질문 시 이 skill만으로 답 가능
- 본문 200줄 이내 (길면 reference로 분리 고려)
