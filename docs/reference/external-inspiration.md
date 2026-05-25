# External inspiration

This file is a tracked parking lot for external projects that should influence
the multi-harness agent OS refactor. Treat these as reference material, not
runtime dependencies.

## Gem Team

- Repository: https://github.com/mubaidr/gem-team
- Local reference clone: `.omo/inspiration/gem-team`
- Clone command: `git clone --depth 1 https://github.com/mubaidr/gem-team.git .omo/inspiration/gem-team`
- Snapshot inspected: `6f61ede11c27`
- License: Apache-2.0
- Status: reference only. Do not vendor into `src/` or import from it at runtime.

Why this matters for OMO:

- Gem Team packages agent definitions as static files under `.apm/agents/` with
  an `apm.yml` manifest. That is directly relevant to the ROADMAP split between
  Skills, Core, and Adapters.
- Its agent roster is a useful comparison set for Team Mode: orchestrator,
  researcher, planner, implementer, reviewer, critic, debugger, browser tester,
  designer, mobile specialists, DevOps, documentation writer, simplifier, and
  skill creator.
- Its orchestrator keeps the lead agent out of direct execution and validation.
  Execution, plan review, critique, debugging, and verification are delegated to
  specialized agents.
- Its planner emits file-based artifacts: `docs/plan/{plan_id}/plan.yaml`,
  `context_envelope.json`, contracts, waves, dependencies, conflicts, risk, and
  handoff fields. This is worth comparing against `.omo/plans/`, Boulder state,
  and Team Mode task state.
- Its context envelope pattern is the strongest idea to consider: one durable,
  evidence-heavy context bundle is generated once, then enriched after each
  wave. Subagents consume the envelope instead of rediscovering the same files.
- Its memory ownership rule is clean: the orchestrator owns durable memory,
  while subagents receive curated context through the envelope and return
  structured learnings.
- Its validation loop is explicit: planner output can be reviewed by a reviewer
  and critic before execution; each wave gets integration review; failures route
  through debugger before implementer.
- Its cross-harness packaging story through APM is useful prior art for the
  multi-harness direction, even if OMO should not copy APM as an architectural
  dependency.

What to mine first:

1. Compare `.apm/agents/*.agent.md` frontmatter and role contracts with OMO's
   current agent factories and built-in skills.
2. Prototype a first-party OMO plan artifact that borrows the useful parts of
   Gem Team's `plan.yaml` and `context_envelope.json` without taking its file
   layout wholesale.
3. Evaluate whether Team Mode should expose wave/dependency/conflict metadata as
   first-class task fields rather than only conversational coordination.
4. Pull the durable-learning shape into OMO's own memory surfaces: facts,
   patterns, gotchas, failure modes, decisions, and conventions.

Guardrails:

- Keep this as inspiration, not donor code.
- Re-check upstream before porting any concrete idea; this snapshot was captured
  on 2026-05-25.
- Preserve OMO's current ROADMAP direction: pure TypeScript Core first, MCP and
  Skills as static/process boundaries, thin harness-specific Adapters.
- If code is ever copied rather than reimplemented, do a separate license review
  and keep provenance in the commit that introduces it.

## Nearby name matches

These surfaced during the search but are secondary to Gem Team for the current
OMO refactor:

- Agent Desk: https://github.com/warunacds/agentdesk
  - Useful for UI and inventory ideas around scanning tool-specific skills,
    agents, commands, MCP servers, project scopes, and enable-disable state.
  - Less useful for OMO's runtime agent loop because it is a desktop management
    app, not an orchestration harness.
- GemDesk: https://github.com/openconstruct/gemdesk
  - Useful for multimodal file ingestion and Gemini context caching ideas.
  - Less useful for OMO's multi-agent architecture because it is a local
    NotebookLM-style application rather than an agent team framework.
