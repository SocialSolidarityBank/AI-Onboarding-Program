# q-harness

> A reusable harness for delegating multi-agent work in phases.

[한국어 → README.md](README.md)

---

## TL;DR

A **GitHub Template repository** that pre-defines a work-distribution pattern, so you don't redesign "how to split work across agents" every time you start a new project.

## Why

Working with multiple agents (Claude, Codex, opencode, Hermes, etc.) repeatedly raises the same questions:

- Which work goes to a capable model (Sonnet/Opus tier) and which to a cheap model (Kimi K2 etc.)?
- Which work can run in parallel and which must be sequential?
- What format makes the same brief readable by every tool?

q-harness freezes that pattern as **phase folders + a standard brief format**. New projects clone the template and fill in their own phases.

## Core Concepts

| Concept | Meaning |
|---|---|
| **Phase** | A work bundle. One folder (e.g. `phases/01_design/`) |
| **Brief** | One markdown file inside a phase. The instruction sheet for one agent |
| **Model tier** | `capable` (design / review) vs `cheap` (mechanical conversion / repetition) — no model names hardcoded |
| **Parallel** | Whether briefs in the same phase folder can run concurrently |
| **Tool neutrality** | Briefs name capabilities ("agentic CLI with file write") instead of products ("Claude Code") |

## Repository Layout

```
q-harness/
├── README.md / README.en.md      this file
├── SETUP.md  / SETUP.en.md       guide for applying to a new project
├── AGENTS.md                     baseline for every agent (tool-neutral)
├── CLAUDE.md → AGENTS.md         symlink for Anthropic compatibility
├── docs/
│   └── PHASE-FORMAT.md           detailed phase-file format spec
├── templates/
│   └── phase.md                  blank phase template (copy and fill)
├── phases/                       empty (filled by the new project)
└── examples/
    └── q-system-config-migration/   real-world case (reference only)
        ├── EXAMPLE-NOTES.md
        └── phases/                  8 actual briefs
```

## Quickstart

Full steps in [SETUP.en.md](SETUP.en.md).

```
1. Click "Use this template" on GitHub → create a new repo
2. Clone, then edit AGENTS.md (identity, purpose, principles)
3. Create phase folders under phases/
4. cp templates/phase.md phases/01_xxx/yyy.md → fill in
5. Delegate to an agent: "Execute this brief → @phases/01_xxx/yyy.md"
```

## Out of Scope

- **Scenario presets** — phase composition varies per project; no presets shipped
- **Generator scripts** — copying a blank template is enough
- **Automatic dependency-graph visualization** — phase counts are small, manual is fine

## Reference Case

`examples/q-system-config-migration/` is the first real project run through this harness (Obsidian vault → GitHub repo migration, 8 phases). Use it as a reference when designing your own phase composition.

## License

Free to use. The operating principles inside are the author's (seongqkim) personal patterns, not a mandated standard.
