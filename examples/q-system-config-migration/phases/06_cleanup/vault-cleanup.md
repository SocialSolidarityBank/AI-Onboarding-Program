# Phase 6: vault 정리

## Agent
- **Model**: Kimi K2 또는 수동
- **Tool**: opencode (yolo) 또는 직접
- **병렬**: ×
- **🚨 전제**: Phase 5 모든 검수 통과 + `git push` 완료된 상태에서만 실행

## Goal
vault `Q/90_SYSTEM/`을 README pointer 한 장으로 축소, 기존 콘텐츠는 안전 격리.

## Pre-check
```bash
# 새 레포가 GitHub에 push되었는지 확인
cd ~/Code/q-system-config
git log -1
git remote -v
gh repo view  # 또는 브라우저로 확인
```
push 안 됐으면 **중단**.

## Procedure

### 1. 기존 90_SYSTEM 격리 (삭제 X)
```bash
VAULT="/Users/seongqkim/Library/Mobile Documents/iCloud~md~obsidian/Documents/Q"
DATE=$(date +%Y%m%d)
mkdir -p "$VAULT/99_ARCHIVE/TO-DELETE/90_SYSTEM_$DATE"
mv "$VAULT/90_SYSTEM"/* "$VAULT/99_ARCHIVE/TO-DELETE/90_SYSTEM_$DATE/"
```

### 2. 새 README pointer 작성
`$VAULT/90_SYSTEM/README.md`:
```markdown
# 90_SYSTEM 정본 이전됨

이 시스템의 정본은 GitHub로 이전되었습니다.

- **Repo**: github.com/<user>/q-system-config
- **Local**: ~/Code/q-system-config
- **세션 진입**: `cd ~/Code/q-system-config && claude`

이 vault에는 INBOX·노트·아이디어만 둡니다.
시스템 정의 문서(워크플로우, agent_mode, INBOX 라우팅 등)는 위 레포 참조.

이전일: <YYYY-MM-DD>
```

### 3. 임시 staging 정리
```bash
rm -rf "$VAULT/_migration-staging"
```

### 4. CLAUDE.md 처리
vault root의 `Q/CLAUDE.md`도 새 레포 안내로 변경 또는 제거.
권장: 짧은 pointer로 유지.
```markdown
# Q vault — 자유 위키

이 vault는 INBOX·노트·아이디어를 위한 자유 위키입니다.
시스템 정본(워크플로우/agent_mode/INBOX 등)은 ~/Code/q-system-config 참조.
```

## 사후 (1주 후, 본인 직접)
1주 안정 운영 확인 후:
```bash
rm -rf "$VAULT/99_ARCHIVE/TO-DELETE/90_SYSTEM_$DATE"
```

## Success Criteria
- `Q/90_SYSTEM/`에 README.md만 남음
- 기존 콘텐츠는 `99_ARCHIVE/TO-DELETE/`에 백업됨
- vault에서 새 세션 시작해도 혼란 없음 (pointer가 명확)

## Rollback (필요 시)
```bash
mv "$VAULT/99_ARCHIVE/TO-DELETE/90_SYSTEM_$DATE"/* "$VAULT/90_SYSTEM/"
```
