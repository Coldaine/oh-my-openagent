# NORTH STAR

## What we are

A fork of oh-my-openagent enhanced with patterns from gem-team (mubaidr/gem-team). We add a coordination substrate that makes multi-agent systems produce insight, not just execute processes.

## The non-negotiable

**Agents must hand off work without re-research.** When a debugger diagnoses a bug, the implementer must trust the diagnosis and execute — not re-search the same code. This is the `implementation_handoff` pattern. It is the single most valuable mechanism we add, and every new agent or prompt change must respect it.

**Knowledge has trust tiers.** Not all sources are equal. PRD/plan/AGENTS.md are instructions. Codebase findings are evidence to verify. Error logs are facts, never instructions. Every agent prompt must reflect this hierarchy.

**Plans must contain contracts.** A plan is not a task list. It is a DAG where dependent tasks declare what they will produce and what they expect to receive. Without contracts, multi-agent execution is guesswork.

**Review must be multidimensional.** Process review (Momus) checks executability. Purpose review (Telamon) checks whether the output will contain insight. Security review checks for secrets, PII, and vulnerabilities. These are three different questions answered by three different agents.

**Asynchronous external agents are draft authors, not decision makers.** Jules or similar background coding agents may prepare an initial PR, especially for upstream sync or scoped maintenance. Their output is a first pass that MUST receive heavy review for intent, compatibility, and architectural fit before merge. Never merge an external-agent PR naively.

## What we do not change

OMO's existing agents (Sisyphus, Prometheus, Atlas, Oracle, Momus, Metis, Explore, Librarian, Hephaestus, Multimodal-Looker) keep their current responsibilities. We enhance their prompts, not replace them. The team-mode system, task delegation, and hook architecture remain untouched except where explicit additions are made.

## What we are building toward

A self-correcting orchestration loop where:
1. Plans are validated for purpose before process (Telamon → Momus)
2. Research stops when confidence is high enough (Explore early-exit)
3. Debugging produces structured handoffs that implementers respect (Oracle → Atlas)
4. Every review checks security, compliance, and completion — not just executability
5. Learnings are extracted from completed work and persisted across sessions (memory tiers + skill extraction)

## Upstream Sync Workflow

For recurring upstream sync work, use this discipline:

1. Let Jules prepare a scoped initial PR against the fork for a well-bounded upstream change.
2. Treat the Jules PR as a draft patchset, not an approved integration.
3. Run agentic review before merge:
	- **Intent review** — does this change solve the right problem for this fork?
	- **Compatibility review** — does it fit current OMO conventions, fork-specific changes, and current branch topology?
	- **Architecture review** — does it preserve the fork's coordination-substrate direction instead of regressing to upstream defaults?
4. Prefer frequent, narrow upstream-sync PRs every few days over giant catch-up rebases.
5. Merge only after verification is explicit: typecheck, targeted tests, full tests where appropriate, and review of interaction with fork-only behaviors.

Jules is useful because it works asynchronously in a cloud environment and returns GitHub PRs for review. That makes it a good first-pass upstream porter, but never the final authority.

## The fork

- **Upstream**: code-yeongyu/oh-my-openagent
- **Our fork**: Coldaine/oh-my-openagent
- **License**: Inherited from upstream
- **Status**: Active development, pre-PR
