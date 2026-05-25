---
name: prometheus-agent
description: Developer reference for the Prometheus strategic planner agent prompt loaders, prompts-core markdown variants, and model routing.
---

# src/agents/prometheus/ -- Strategic Planner

**Generated:** 2026-05-24

## OVERVIEW

5 TypeScript files plus 3 markdown prompt variants in [`packages/prompts-core/prompts/prometheus/`](file:///Users/yeongyu/local-workspaces/omo/packages/prompts-core/prompts/prometheus/). Prometheus remains the interview-mode strategic planner, but this directory is now a thin adapter layer. Prompt content lives in `packages/prompts-core`; `src/agents/prometheus/` only loads the right markdown variant and applies runtime tool gating.

This shape follows the package layering refactor in [`ROADMAP.md`](file:///Users/yeongyu/local-workspaces/omo/ROADMAP.md): prompts are harness-neutral core assets, while the OpenCode adapter keeps only model routing and runtime integration.

## FILES

| File | Purpose |
|------|---------|
| `index.ts` | Barrel exports |
| `system-prompt.ts` | Thin loader using `loadPromptSync()` and `prometheusPromptVariants` from `@oh-my-opencode/prompts-core`; exports prompt source routing and disabled-tool filtering |
| `gpt.ts` | Thin loader for `PROMETHEUS_GPT_SYSTEM_PROMPT` from `packages/prompts-core/prompts/prometheus/gpt.md` |
| `gemini.ts` | Thin loader for `PROMETHEUS_GEMINI_SYSTEM_PROMPT` from `packages/prompts-core/prompts/prometheus/gemini.md` |
| `system-prompt.test.ts` | Runtime behavior tests for Question tool filtering |
| `prometheus-byte-exactness.test.ts` | Byte-exact sha256 characterization tests for all variants and Question disabled state |
| `packages/prompts-core/prompts/prometheus/default.md` | Default/Claude markdown prompt variant |
| `packages/prompts-core/prompts/prometheus/gpt.md` | GPT-optimized markdown prompt variant |
| `packages/prompts-core/prompts/prometheus/gemini.md` | Gemini-optimized markdown prompt variant |

## MODEL VARIANT ROUTING

[`system-prompt.ts`](file:///Users/yeongyu/local-workspaces/omo/src/agents/prometheus/system-prompt.ts) exposes `getPrometheusPromptSource(model)`:

- GPT family models, as detected by `isGptModel(model)`, route to `"gpt"`.
- Gemini family models, as detected by `isGeminiModel(model)`, route to `"gemini"`.
- Missing models and all other families route to `"default"`.

`getPrometheusPrompt(model, disabledTools)` then loads the selected markdown through `loadPromptSync({ source: prometheusPromptVariants[variant], name: "prometheus", variant })` and returns the loaded body.

## DISABLED TOOL HANDLING

Prometheus normally includes `Question({ ... })` examples because interview mode uses the Question tool to clarify scope. When the runtime passes `disabledTools` containing `"question"`, `getPrometheusPrompt()` strips fenced TypeScript `Question({ ... })` examples with `QUESTION_TOOL_BLOCK_RE` before returning the prompt.

This filtering is runtime adapter behavior. Do not duplicate stripped markdown variants in `packages/prompts-core`; keep one source of truth per model family and let `system-prompt.ts` remove Question examples only when the tool is disabled.

## KEY CONSTRAINTS

- May ONLY create/edit `.md` files (enforced by hook)
- FORBIDDEN paths: `src/`, `package.json`, config files
- Must explore codebase before planning (NEVER plan blind)
- Plans saved to `.omo/plans/`
- Acceptance criteria requiring "user manually tests" are FORBIDDEN
- Prompt edits belong in [`packages/prompts-core/prompts/prometheus/`](file:///Users/yeongyu/local-workspaces/omo/packages/prompts-core/prompts/prometheus/), not in TypeScript section files

## PLAN OUTPUT FORMAT

The markdown variants instruct Prometheus to produce YAML plans with a parallel task graph:

- Waves (parallel execution groups)
- Tasks with dependencies, category, skills
- Each task has atomic scope + verification criteria

## PLAN ENHANCEMENTS (commit `ea1eb6e3`)

`plan-template.ts` now mandates three additional sections:

**Pre-Mortem Risk Analysis** (MANDATORY for Medium+ effort tasks):
- Overall risk level
- Critical failure modes table: scenario / likelihood / impact / mitigation
- Key assumptions that must hold for the plan to succeed

**Task Contracts** (MANDATORY):
- Interface definitions between every pair of dependent tasks
- Format: `from_task → to_task`, `interface` (what is passed), `format` (exact structure)
- Prevents agents from guessing what a preceding task produced

**Sizing Limits per task:**
- `estimated_files` must be ≤ 3
- `estimated_lines` must be ≤ 300
- Tasks exceeding these must be decomposed further

**Failure Modes per task** (REQUIRED for Medium+ priority): explicit conditions that indicate the task has failed and what to do next.

`plan-generation.ts` Oracle phase-2 verification expanded from 6 to 9 checks (added: pre-mortem present, sizing within limits, contracts cover all dependencies). Self-review checklist expanded from 9 to 12 checks.
