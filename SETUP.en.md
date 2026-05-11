# SETUP — Apply to a New Project

[한국어 → SETUP.md](SETUP.md)

---

A 6-step guide to turn q-harness into a working project repo.

## 1. Create the Repo

On the q-harness GitHub page, click **"Use this template"** → **Create a new repository** → name it (e.g. `my-project`) → Private recommended → Create.

```bash
git clone https://github.com/<your-username>/my-project
cd my-project
```

## 2. Define Identity (AGENTS.md)

Edit `AGENTS.md` for your project. Required:

- **Operator** — who runs this repo (1-2 lines)
- **Purpose** — what this repo is for (1 line)
- **Core Principles** — 1-3 principles applied to all work

**Forbidden**:
- Tool product names ("Claude Code", "opencode", etc.) hardcoded
- Tool-specific feature dependencies ("/compact command will...")
- Concrete workflows — split into phase briefs or separate docs

Verify:
```bash
grep -i "claude code\|opencode\|cursor\|codex" AGENTS.md
# must return zero matches
```

`CLAUDE.md` is a symlink to `AGENTS.md`, no separate edit needed.

## 3. Design Phase Composition

Decide what phases your project needs. **Phase count and naming are free.**

Heuristic:

| Scenario | Typical phase composition |
|---|---|
| Migration | design → scaffold → migrate → review → cleanup (5–8) |
| New feature | design → impl → test → review (3–4) |
| Refactor | analyze → plan → refactor → verify (4) |
| Trivial work | one brief, no phase folder needed |

Open `examples/q-system-config-migration/phases/` and find a similar scenario for reference.

Folder naming:
- Numeric prefix marks dependency: `01_design/`, `02_scaffold/`, ...
- Branches within a step use letters: `04a_skeletons/`, `04b_bodies/`
- File names describe the work: `classify-and-plan.md`, `execute-migration.md`

## 4. Write Phase Briefs

Create the phase folder and copy the blank template:

```bash
mkdir -p phases/01_design
cp templates/phase.md phases/01_design/plan.md
```

Open `phases/01_design/plan.md` and fill it in:

```markdown
# Phase 1: Design

## Agent
- **Model tier**: capable
- **Tool**: agentic CLI with file read/write
- **Parallel**: no

## Depends on
- (none — first phase)

## Goal
Produce the project-wide classification table and structure plan.

## Inputs
- `docs/requirements.md`

## Outputs
- `phases/_artifacts/CLASSIFICATION.md`
- `phases/_artifacts/STRUCTURE.md`

## Instructions
1. Read requirements.md and classify work units
2. ...

## Success Criteria
- [ ] Every CLASSIFICATION.md item labeled A/B/C
- [ ] STRUCTURE.md uses real file paths

## Notes
```

Field meanings unclear? See `docs/PHASE-FORMAT.md`.

## 5. Verify

Before push / execution:

```bash
# AGENTS.md tool-neutrality
grep -i "claude code\|opencode\|cursor\|codex" AGENTS.md && echo "FAIL" || echo "OK"

# Required sections present in every brief
for f in phases/**/*.md; do
  grep -q "## Agent" "$f" || echo "MISSING Agent: $f"
  grep -q "## Goal" "$f" || echo "MISSING Goal: $f"
  grep -q "## Success Criteria" "$f" || echo "MISSING SC: $f"
done

# Verify "Depends on" paths exist (manual)
grep -r "Depends on" phases/ -A 5
```

Confirm `git status` is clean and no unintended files are staged.

## 6. Execute

Delegate each brief to an agent:

```
You → Agent:
"Execute this brief. Mark all Success Criteria when done.
@phases/01_design/plan.md"
```

Following the dependency graph:
- Wait for upstream phase completion before starting the next
- Briefs marked `Parallel: yes` in the same phase can be delegated concurrently
- `Parallel: no` runs sequentially

External publication (git push, deploy, etc.) only after the review phase (usually just before the last phase) PASSes.

---

## FAQ

**Q. Can I have just one phase?**
A. Yes. Trivial work fits in a single brief. Phase folder structure only matters when work splits into multiple steps.

**Q. Can I delete `examples/`?**
A. Yes, you can in your new project. Most people keep it as a reference when designing the first phase.

**Q. Can I edit CLAUDE.md directly?**
A. No. Edit `AGENTS.md` only. CLAUDE.md is a symlink and auto-reflects changes.

**Q. Codex/opencode can't find `.claude/skills/`?**
A. Add a symlink like `.codex/skills`, `.opencode/skills`. See `examples/q-system-config-migration/phases/05a_review-capable/codex-compat.md`.
