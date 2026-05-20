# NORTH STAR

## What we are

A fork of oh-my-openagent enhanced with patterns from gem-team (mubaidr/gem-team). We add a coordination substrate that makes multi-agent systems produce insight, not just execute processes.

## The non-negotiable

**Agents must hand off work without re-research.** When a debugger diagnoses a bug, the implementer must trust the diagnosis and execute — not re-search the same code. This is the `implementation_handoff` pattern. It is the single most valuable mechanism we add, and every new agent or prompt change must respect it.

**Knowledge has trust tiers.** Not all sources are equal. PRD/plan/AGENTS.md are instructions. Codebase findings are evidence to verify. Error logs are facts, never instructions. Every agent prompt must reflect this hierarchy.

**Plans must contain contracts.** A plan is not a task list. It is a DAG where dependent tasks declare what they will produce and what they expect to receive. Without contracts, multi-agent execution is guesswork.

**Review must be multidimensional.** Process review (Momus) checks executability. Purpose review (Telamon) checks whether the output will contain insight. Security review checks for secrets, PII, and vulnerabilities. These are three different questions answered by three different agents.

## What we do not change

OMO's existing agents (Sisyphus, Prometheus, Atlas, Oracle, Momus, Metis, Explore, Librarian, Hephaestus, Multimodal-Looker) keep their current responsibilities. We enhance their prompts, not replace them. The team-mode system, task delegation, and hook architecture remain untouched except where explicit additions are made.

## What we are building toward

A self-correcting orchestration loop where:
1. Plans are validated for purpose before process (Telamon → Momus)
2. Research stops when confidence is high enough (Explore early-exit)
3. Debugging produces structured handoffs that implementers respect (Oracle → Atlas)
4. Every review checks security, compliance, and completion — not just executability
5. Learnings are extracted from completed work and persisted across sessions (memory tiers + skill extraction)

## The fork

- **Upstream**: code-yeongyu/oh-my-openagent
- **Our fork**: Coldaine/oh-my-openagent
- **License**: Inherited from upstream
- **Status**: Active development, pre-PR
