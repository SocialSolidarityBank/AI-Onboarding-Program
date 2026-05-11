# AGENTS.md

This repository is a **harness** — a reusable scaffold for organizing multi-agent work into phases, where each phase is a markdown brief assigned to an agent of a specific capability tier.

## Operator

Single human operator who designs the phase graph, delegates execution to agents, and verifies outputs. Agents are workers, not decision-makers.

## Core Principles

1. **One phase = one brief.** Each markdown file under `phases/` is a self-contained instruction set for one agent. It must be executable without reading other phases.
2. **Tool neutrality.** This document and all phase files describe agents by capability (model tier, tool affordances) — not by product name. Any agent that meets the stated capabilities can execute the work.
3. **Dependency over time.** Phases run in dependency order, not chronological order. Independent phases run in parallel.
4. **Verify before push.** No external publication (git push, deploy, send) until the corresponding review phase passes.

## Where to Look

- New here? Read `README.md` first, then `SETUP.md`.
- Writing a phase file? Copy `templates/phase.md`. Format details in `docs/PHASE-FORMAT.md`.
- Want a worked example? See `examples/q-system-config-migration/`.
