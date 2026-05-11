# Review: Skill 트리거 테스트

## Agent
- **Model**: Sonnet 4.6 (capable)
- **Tool**: Claude Code, **빈 컨텍스트 새 세션**, `~/Code/q-system-config`
- **병렬**: 05a 다른 파일들과 동시 가능

## Goal
각 skill이 적절한 질문에 자동 트리거되는지, 무관한 질문에는 트리거 안 되는지 검증.

## Procedure

각 skill에 대해 **트리거되어야 할 질문**과 **트리거되면 안 되는 질문** 한 쌍씩 테스트.

### workflow-6stage
- ✅ 트리거 기대: "이 노트 워크플로우 어디 단계지?"
- ❌ 트리거 X: "오늘 점심 뭐 먹지?"

### agent-mode
- ✅ "agent_mode가 review인 노트는 어떻게 처리해?"
- ❌ "Python 슬라이싱 문법 알려줘"

### inbox-routing
- ✅ "iOS 단축어로 들어온 입력 어디 가?"
- ❌ "오늘 날씨 어때?"

### frontmatter-spec
- ✅ "새 노트 만들려는데 frontmatter 어떻게 써?"
- ❌ "장보기 목록 만들어줘"

### archive-policy
- ✅ "이 파일 아카이브해야 하는데 KEEP이야?"
- ❌ "고양이 사진 그려줘"

## 테스트 방법
각 질문을 빈 컨텍스트 세션에서 던지고:
- skill이 자동 로드됐는지 확인 (Claude Code UI 또는 응답 내용으로 추정)
- 무관한 질문 시 skill이 컨텍스트에 안 들어왔는지

## Output
`migration-tasks/_review/skill-trigger-result.md`:
- skill별 ✅/❌ 결과
- description 조정 제안 (트리거 정확도 부족한 skill)

## Failure 시
Phase 4a로 돌아가서 description 라인만 수정 (본문은 안 건드림). 
짧고 정확하게, 사용자가 쓸 트리거 표현 포함.
