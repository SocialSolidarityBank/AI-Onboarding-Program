# Review: 링크 무결성 검사

## Agent
- **Model**: Kimi K2 (또는 직접 grep)
- **Tool**: opencode (yolo) 또는 bash
- **병렬**: 05b 다른 파일들과 동시 가능

## Goal
Phase 3에서 경로/wikilink 치환된 결과 깨진 링크 없는지 검증.

## Procedure

### 1. vault 경로 잔존 검사
```bash
cd ~/Code/q-system-config
grep -rn "Q/90_SYSTEM" . --include="*.md" 2>/dev/null
grep -rn "iCloud~md~obsidian" . --include="*.md" 2>/dev/null
```
**Expected**: 결과 없음 (마이그레이션 변경 로그 제외)

### 2. 깨진 wikilink 검사
```bash
# wikilink 패턴 추출
grep -rohE "\[\[[^]]+\]\]" --include="*.md" . | sort -u > /tmp/wikilinks.txt

# 각 wikilink 대상 파일 존재 확인
while IFS= read -r link; do
  target=$(echo "$link" | sed 's/\[\[//; s/\]\]//; s/|.*//')
  if ! find . -name "${target}.md" -o -name "${target}/SKILL.md" | grep -q .; then
    echo "BROKEN: $link"
  fi
done < /tmp/wikilinks.txt
```

### 3. 마크다운 상대 링크 검사
```bash
# [text](path) 패턴
grep -rnE "\]\([^)h][^)]*\)" --include="*.md" . | \
  grep -v "^Binary" | \
  awk -F: '{print $1, $NF}' | head -50
```
수동 검토.

### 4. SKILL.md 경로 일관성
```bash
find .claude/skills -name "SKILL.md" -exec head -5 {} \; 
```
모든 SKILL.md가 frontmatter 가지고 있는지 확인.

## Output
`migration-tasks/_review/link-integrity-result.md`:
- vault 경로 잔존: 0 (또는 발견된 위치)
- 깨진 wikilink 목록
- 깨진 상대 링크 목록
- SKILL.md frontmatter 누락 목록

## Failure 시
발견된 깨진 링크는 capable 모델 한 세션으로 일괄 수정.
대량이면 PLAN.md 치환 규칙 누락이 의심됨 → Phase 3 재실행 검토.
