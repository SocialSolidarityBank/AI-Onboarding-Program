# Skill 본문 작성: inbox-routing

## Target
`.claude/skills/inbox-routing/SKILL.md` 본문

## Source
- Phase 1 분류표에서 "INBOX" 또는 "inbox" 관련 원본 파일들 (4채널 정의)

## Goal
INBOX 4채널(Telegram bot, iOS shortcut, 직접 입력, 업로드)과 라우팅 룰을 SKILL.md 본문에 정리.

## Instructions
1. SKILL.md 열고 frontmatter 아래 본문 영역 확인
2. source 파일 읽고 다음 구조로 작성:
   - 4채널 각각: 이름, 입력 형태, 도착 위치
   - 라우팅 룰 (어떤 입력이 어디로 가는지)
   - INBOX → DRAFT 전이 조건
   - 각 채널의 특이 처리 (있으면)
3. 표 권장 (채널 / 형태 / 도착 / 후속)

## 절대 규칙
- frontmatter 수정 금지
- source에 없는 채널 추가 금지
- 불확실: `<!-- TODO -->`

## Success Criteria
- "텔레그램 봇으로 들어온 입력은 어디 가?" 질문에 이 skill로 답 가능
