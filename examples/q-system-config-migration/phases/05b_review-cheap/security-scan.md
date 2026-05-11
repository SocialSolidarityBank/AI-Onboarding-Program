# Review: 보안 스캔 (push 전 필수)

## Agent
- **Model**: Kimi K2 또는 직접 실행
- **Tool**: opencode 또는 bash
- **병렬**: 05b 다른 파일들과 동시 가능
- **🚨 게이트**: 이 검사 통과 전 `git push` 절대 금지

## Goal
민감 정보(API 키, 토큰, 회원/상조회 데이터, 기타 PII)가 새 레포에 섞이지 않았는지 검증.

## Procedure

### 1. API 키/토큰 패턴 검사
```bash
cd ~/Code/q-system-config

# 일반 시크릿 패턴
grep -rEn "(sk-[a-zA-Z0-9]{20,}|api[_-]?key|secret|token|bearer)" \
  --include="*.md" --include="*.json" --include="*.yml" \
  -i . 2>/dev/null

# OpenAI/Anthropic/OpenRouter 패턴
grep -rEn "(sk-ant-|sk-or-|sk-proj-)" --include="*" . 2>/dev/null

# AWS
grep -rEn "AKIA[0-9A-Z]{16}" --include="*" . 2>/dev/null
```

### 2. 한국 PII 패턴
```bash
# 주민번호 패턴 (XXXXXX-XXXXXXX)
grep -rEn "[0-9]{6}-[0-9]{7}" --include="*.md" . 2>/dev/null

# 휴대폰 번호
grep -rEn "01[0-9]-?[0-9]{3,4}-?[0-9]{4}" --include="*.md" . 2>/dev/null

# 사업자등록번호
grep -rEn "[0-9]{3}-[0-9]{2}-[0-9]{5}" --include="*.md" . 2>/dev/null
```

### 3. 민감 키워드 (사회연대은행 도메인)
```bash
grep -rEni "(상조회|회원[가-힣]*등록|개인정보|민감)" --include="*.md" . 2>/dev/null
```
발견되면 manual 검토 — 시스템 정의 문서에는 들어갈 수 있지만, 실제 회원 데이터/사례는 안 됨.

### 4. gitleaks (옵션, 권장)
```bash
# 미설치 시: brew install gitleaks
gitleaks detect --source . --no-git -v
```

### 5. 큰 파일 검사
```bash
find . -size +1M -not -path './.git/*' -ls
```
큰 파일은 보통 콘텐츠가 아닌 다른 것 (이미지, 백업) → 의도 확인.

## Output
`migration-tasks/_review/security-scan-result.md`:
- 각 검사 결과 (발견 0 또는 발견 위치 목록)
- gitleaks 결과 (실행했으면)
- 큰 파일 목록
- **최종 판정**: PUSH OK / PUSH BLOCKED

## Failure 시
- 키/토큰 발견 → 즉시 제거, `.gitignore`에 패턴 추가
- PII 발견 → 해당 노트 vault로 환원, 새 레포에서 제거
- **이미 git history에 들어갔다면** `git filter-repo` 또는 새 레포 처음부터 재생성 (history 노출 위험)

## Push 절차 (Pass 시)
```bash
cd ~/Code/q-system-config
git add .
git status  # 한 번 더 육안 확인
git commit -m "initial canon migration"
git remote add origin git@github.com:<user>/q-system-config.git
git push -u origin main
```
