---
name: agents-directory
description: Developer reference for all 12 Oh My OpenAgent agent definitions, factory patterns, tool restrictions, and model routing.
---

# src/agents/ — 12 Agent Definitions

**Generated:** 2026-05-15

## OVERVIEW

11 built-in agents. Type enum: [`src/config/schema/agent-names.ts`](src/config/schema/agent-names.ts) `BuiltinAgentNameSchema`. 10 of them register via [`builtin-agents.ts`](src/agents/builtin-agents.ts) `agentSources` record (factory functions). **Prometheus is special-cased** — it has no `createPrometheusAgent` factory; instead [`prometheus-agent-config-builder.ts`](src/plugin-handlers/prometheus-agent-config-builder.ts) constructs its config directly during `agent-config-handler` Phase 3.

All factories follow `createXXXAgent(model) → AgentConfig`. Each carries a static `mode` property (`AgentFactory` type in [`src/agents/types.ts`](src/agents/types.ts)). Composed via `buildAgent()`.

## AGENT INVENTORY

Modes verified from each agent file's `const MODE: AgentMode = ...` and (for Prometheus) [`prometheus-agent-config-builder.ts:100`](src/plugin-handlers/prometheus-agent-config-builder.ts#L100). Chains verified from [`src/shared/model-requirements.ts`](src/shared/model-requirements.ts).

| Agent | Default Model | Temp | Mode | Fallback (after default) | Purpose |
|-------|---------------|------|------|--------------------------|---------|
| **Sisyphus** | claude-opus-4-7 max | (model default) | primary | kimi-k2.6 → k2p5 → kimi-k2.5 → gpt-5.5 medium → glm-5 → big-pickle | Main orchestrator, plans + delegates; `thinking: { type: "enabled", budgetTokens: 32000 }` |
| **Hephaestus** | gpt-5.5 medium | (model default) | primary | (single-entry chain — `requiresProvider`: openai \| github-copilot \| venice \| opencode \| vercel) | Autonomous deep worker |
| **Oracle** | gpt-5.5 high | 0.1 | subagent | gemini-3.1-pro high → claude-opus-4-7 max → glm-5.1 | Read-only consultation + debugging mode (4-phase diagnosis, Three-Fail Rule, structured `[IMPLEMENTATION_HANDOFF]` output) |
| **Librarian** | gpt-5.4-mini-fast | 0.1 | subagent | qwen3.5-plus → minimax-m2.7-highspeed → minimax-m2.7 → claude-haiku-4-5 → gpt-5.4-nano | External docs/code search |
| **Explore** | gpt-5.4-mini-fast | 0.1 | subagent | qwen3.5-plus → minimax-m2.7-highspeed → minimax-m2.7 → claude-haiku-4-5 → gpt-5.4-nano | Contextual grep with confidence-based early exit; clarify mode for ambiguous requests |
| **Multimodal-Looker** | gpt-5.5 medium | 0.1 | subagent | kimi-k2.6 → glm-4.6v → gpt-5-nano | PDF/image analysis |
| **Metis** | claude-sonnet-4-6 | **0.3** | subagent | claude-opus-4-7 max → gpt-5.5 high → glm-5.1 → k2p5 | Pre-planning consultant |
| **Momus** | gpt-5.5 xhigh | 0.1 | subagent | claude-opus-4-7 max → gemini-3.1-pro high → glm-5.1 | Plan reviewer |
| **Atlas** | claude-sonnet-4-6 | 0.1 | primary | kimi-k2.6 → gpt-5.5 medium → minimax-m2.7 | Todo-list orchestrator |
| **Prometheus** | claude-opus-4-7 max | (override-only) | primary | gpt-5.5 high → glm-5.1 → gemini-3.1-pro | Strategic planner (interview); built via `buildPrometheusAgentConfig` (not in `agentSources`) |
| **Sisyphus-Junior** | claude-sonnet-4-6 | 0.1 (`SISYPHUS_JUNIOR_DEFAULTS`) | subagent | kimi-k2.6 → gpt-5.5 medium → minimax-m2.7 → big-pickle | Category-spawned executor |
| **Telamon** | claude-sonnet-4-6 | 0.1 | subagent | (inherits Sisyphus-Junior chain) | Purpose fitness critic — answers "will this plan produce insight?" before Momus reviews process |

## TOOL RESTRICTIONS

Defined in [`src/shared/agent-tool-restrictions.ts`](src/shared/agent-tool-restrictions.ts).

| Agent | Denied Tools |
|-------|-------------|
| Oracle | write, edit, task, call_omo_agent |
| Librarian | write, edit, task, call_omo_agent |
| Explore | write, edit, task, call_omo_agent |
| Multimodal-Looker | ALL except read |
| Atlas | task, call_omo_agent |
| Momus | write, edit, task |
| Prometheus | enforces `.md`-only writes via `prometheus-md-only` hook (path-based, not tool-based) |
| Telamon | write, edit, task, call_omo_agent |

## TEAM-MODE ELIGIBILITY

Authoritative registry: [`AGENT_ELIGIBILITY_REGISTRY`](src/features/team-mode/types.ts) in `team-mode/types.ts`. Three verdict tiers:

| Verdict | Agents |
|---------|--------|
| `eligible` | sisyphus, atlas, sisyphus-junior |
| `conditional` | hephaestus (lacks `teammate: "allow"` permission by default — see D-36 / `tool-config-handler.ts`; use `subagent_type: "sisyphus"` instead) |
| `hard-reject` | oracle, librarian, explore, multimodal-looker, metis, momus, prometheus, telamon (each with a specific rejection message) |

Read-only agents are rejected at TeamSpec parse time. For those, the lead delegates via `task` (delegate-task) instead. See [`team-mode/AGENTS.md`](src/features/team-mode/AGENTS.md).

## STRUCTURE

```
agents/
├── sisyphus.ts                                # Main orchestrator router
├── sisyphus/                                  # Model-specific variant prompts
│   ├── default.ts, gemini.ts, gpt-5-4.ts, gpt-5-5.ts
├── hephaestus.ts                              # Routes to model variant
├── hephaestus/                                # gpt.ts, gpt-5-3-codex.ts, gpt-5-4.ts, gpt-5-5.ts
├── oracle.ts                                  # Read-only consultant
├── librarian.ts                               # External search
├── explore.ts                                 # Codebase grep
├── multimodal-looker.ts                       # Vision/PDF
├── metis.ts                                   # Pre-planning
├── momus.ts                                   # Plan review
├── telamon.ts                                 # Purpose fitness critic (commit 6ecc0743)
├── atlas/agent.ts                             # Todo orchestrator
├── prometheus/                                # Strategic planner — system-prompt.ts, identity-constraints.ts, interview-mode.ts, plan-template.ts, gemini.ts, gpt.ts
├── types.ts                                   # BuiltinAgentName, AgentMode, AgentConfig
├── builtin-agents.ts                          # agentSources registry (10 → 12 with sisyphus-junior + telamon)
├── builtin-agents/                            # maybeCreateXXXConfig conditional factories + general-agents.ts + available-skills.ts
├── agent-builder.ts                           # buildAgent() composition
├── utils.ts                                   # agent utilities
├── env-context.ts                             # environment context for prompts
├── custom-agent-summaries.ts                  # custom-agent prompt summaries
├── dynamic-agent-prompt-builder.ts            # dynamic prompt builder
├── dynamic-agent-core-sections.ts             # core prompt sections
├── dynamic-agent-policy-sections.ts           # policy sections
├── dynamic-agent-tool-categorization.ts       # tool categorization for prompt
└── dynamic-agent-category-skills-guide.ts     # category-skill guidance
```

## FACTORY PATTERN

```typescript
const createXXXAgent: AgentFactory = (model: string) => ({
  instructions: "...",
  model,
  temperature: 0.1,
  // ...config
})
createXXXAgent.mode = "subagent" // or "primary" or "all"
```

Model resolution: 4-step pipeline → override → category-default → provider-fallback → system-default. Defined in [`shared/model-resolution-pipeline.ts`](src/shared/model-resolution-pipeline.ts).

## MODES

Definition (from [`src/agents/types.ts`](src/agents/types.ts)):

- **`primary`** — respects user's UI-selected model. Used by: sisyphus, hephaestus, atlas, prometheus.
- **`subagent`** — uses own fallback chain, ignores UI selection. Used by: oracle, librarian, explore, multimodal-looker, metis, momus, sisyphus-junior.
- **`all`** — declared in the type for OpenCode compatibility but no built-in agent currently uses it.

## CANONICAL ORDER

`Sisyphus → Hephaestus → Prometheus → Atlas` (primary core agents) then alphabetical for the rest. Enforced by [`installAgentSortShim()`](src/shared/agent-sort-shim.ts) — patches `Array.prototype.{toSorted,sort}` narrowly when ≥2 canonical core agents are in the array. See [`src/plugin-handlers/AGENTS.md`](src/plugin-handlers/AGENTS.md) for the full history.

## DYNAMIC PROMPT BUILDER

`dynamic-agent-prompt-builder.ts` composes per-agent system prompts at runtime by stitching:
- Core sections (identity, mode, restrictions)
- Policy sections (citation, verification, anti-patterns)
- Tool categorization (per-domain tool guidance)
- Category-skills guide (which skills load with which categories)

This is what the Sisyphus prompt's "AGENTS / CATEGORY + SKILLS" tables come from.
