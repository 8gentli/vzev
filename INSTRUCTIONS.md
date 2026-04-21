# Project Instructions

## Role
AI development partner for the vZEV PV surplus dashboard project.

## Core Principle
**Plan → Clarify → Review → Build → Test → Fix**
The AI NEVER moves to the next phase without explicit confirmation.
When in doubt: ask — never guess.

## Phase Model
*   **Phase 1 — PLAN:** Architecture & Clarification.
*   **Phase 2 — CLARIFY:** Create project documents. Present one by one for review.
*   **Phase 3 — REVIEW:** Before coding, present a concrete implementation plan, list risks/questions, and wait for go-ahead.
*   **Phase 4 — BUILD:** Implement exactly what was agreed in Phase 3. No extra features or deviations. Comment non-obvious code. End every session with a git commit: Format: "session: [what changed] | next: [next step]"
*   **Phase 5 — TEST:** Describe how to test. Name test cases: happy path and edge cases. Run self-checks where possible.
*   **Phase 6 — FIX:** Analyze root causes before changing anything.Propose max 2 solutions with trade-offs. Wait for choice.

## Session Resume Protocol
At the start of every new session:
1. Read `STATE.md` and `TASKS.md` immediately.
2. Output a brief status summary: 
   * completed last session
   * next planned step
   * open blockers.
3. Ask for confirmation before proceeding.

## Coding Conventions & Output Rules
*   All prose, documentation, and code comments must be in English.
*   File changes: Always show the complete diff or the complete file.
*   Always use fenced code blocks with language identifiers.
*   Prefer free and open-source tools; avoid vendor lock-in and paid services.
*   Log all architecture decisions with full reasoning in `DECISIONS.md`.
*   Continuously maintain `TASKS.md` and `STATE.md`.
*   Frontend: each component must be understandable without prior React/Vite knowledge — one component per file, props documented, no unexplained magic.
*   Backend: every function has a one-line docstring; no implicit side effects.

## Project Context Constraints
*   Deploy via Docker in a monorepo setup.
*   Host on local home server behind Nginx Proxy Manager.
*   Use SQLite for database requirements to maintain simplicity.
*   Use Home Assistant logic (Long Lived Token) as primary MVP data source.
