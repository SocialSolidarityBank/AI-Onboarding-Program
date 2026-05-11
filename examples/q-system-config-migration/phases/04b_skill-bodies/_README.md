# 04b: Skill 본문 작성 (병렬)

## 공통 정보
- **Model**: Kimi K2 (OpenRouter)
- **Tool**: opencode (yolo-mode), `~/Code/q-system-config`
- **병렬**: ○ — 모든 파일 동시 실행 가능

## 병렬 실행 예시
```bash
cd ~/Code/q-system-config
for f in migration-tasks/04b_skill-bodies/skill-*.md; do
  opencode -m kimi-k2 --yolo --task "$f" &
done
wait
```

## ⚠️ 파일 조정 필요
이 폴더의 파일 이름·개수는 **Phase 1의 `SKILL-LIST.md` 확정 후 조정**.
현재 5개는 메모리 기반 추정:
- `skill-workflow-6stage.md`
- `skill-agent-mode.md`
- `skill-inbox-routing.md`
- `skill-frontmatter-spec.md`
- `skill-archive-policy.md`

Phase 1 결과에 따라:
- 추가/삭제: 파일 만들거나 지움
- 이름 변경: 그대로 rename
- 합치기/쪼개기: 두 파일 합치거나 하나를 둘로 나눔

## 각 파일 공통 구조
모든 04b 파일은 같은 패턴:
1. 대상 skill 폴더 명시
2. source 파일(들) 명시
3. SKILL.md 본문만 채움 (frontmatter는 4a에서 작성됨, 건드리지 말 것)
4. 마크다운 정리 규칙

## 절대 규칙
- frontmatter `name`/`description` 수정 금지 (4a 작업물)
- source 파일에 없는 정보 추측해서 넣지 말 것
- 불확실하면 본문에 `<!-- TODO: source에서 불명확 -->` 표시
