# NORTH_STAR Invariant Classification Report

**Issue:** #21 — Separate NORTH_STAR enforcement from prompt documentation  
**Date:** 2026-05-20  
**Investigator:** Implementation Agent

---

## Summary

All 5 NORTH_STAR invariants are **prompt-only** or **doc-only**. Zero invariants have runtime or test enforcement. The most critical gap: the `Telamon → Momus` ordering invariant (NORTH_STAR's headline claim) is absent from the Prometheus plan generation workflow — Telamon is never invoked, despite the invariant stating plans should go through Telamon before Momus.

---

## Invariant-by-Invariant Classification

### Invariant 1: `implementation_handoff` — Agents must hand off work without re-research

**Source:** NORTH_STAR.md:9  
**Classification:** **Prompt-only** / **Doc-only**  
**Evidence:**

| Surface | What it does | Classification |
|---------|-------------|----------------|
| NORTH_STAR.md:9 | Declares the invariant | Doc-only |
| `src/agents/oracle.ts:12-27` | Describes `implementation_handoff` in comments | Doc-only (JSDoc) |
| `src/agents/atlas/gpt-prompt-sections.ts:134` | Prompt text: "Pass Oracle's implementation_handoff to the implementer — do NOT re-research" | Prompt-only |
| `src/agents/atlas/default-prompt-sections.ts:155-185` | Prompt text: "Resume with Oracle's implementation_handoff" | Prompt-only |
| `src/agents/atlas/gemini-prompt-sections.ts:173` | Same pattern | Prompt-only |
| `src/agents/atlas/kimi-prompt-sections.ts:136` | Same pattern | Prompt-only |
| `src/agents/atlas/opus-4-7-prompt-sections.ts:150-151` | Same pattern | Prompt-only |

**Enforcement:** None. No runtime gate fails if a session re-researches after a handoff. No test asserts handoff consumption. Tests in `atlas-prompt.test.ts` verify prompt text contains `background_output` references but do not test runtime behavior of handoff consumption.

---

### Invariant 2: Knowledge trust hierarchy — Trust tiers for information sources

**Source:** NORTH_STAR.md:11  
**Classification:** **Prompt-only**  
**Evidence:**

| Surface | What it does | Classification |
|---------|-------------|----------------|
| NORTH_STAR.md:11 | Declares the invariant | Doc-only |
| `src/agents/dynamic-agent-policy-sections.ts:193-211` | `buildKnowledgeTrustSection()` — injected into agent prompts | Prompt-only |
| `src/tools/delegate-task/prompt-builder.ts:12-24` | `KNOWLEDGE_TRUST_PREAMBLE` — prepended to task delegation prompts | Prompt-only |
| `src/hooks/rules-injector/constants.ts:23` | Lists `NORTH_STAR.md` as a rule file for injection | Infrastructure (no enforcement) |

**Enforcement:** None. The trust hierarchy is injected as advisory text into agent prompts and task delegation prompts. There is no runtime gate that verifies an agent correctly classified a source. There are zero tests for `buildKnowledgeTrustSection()`, `KNOWLEDGE_TRUST_PREAMBLE`, or any trust-tier compliance.

---

### Invariant 3: Plans must contain contracts (DAG with dependencies)

**Source:** NORTH_STAR.md:13  
**Classification:** **Prompt-only** / **Doc-only**  
**Evidence:**

| Surface | What it does | Classification |
|---------|-------------|----------------|
| NORTH_STAR.md:13 | Declares the invariant | Doc-only |
| `src/agents/prometheus/plan-template.ts` | Plan template includes contract-like fields | Prompt-only |
| `src/agents/prometheus/plan-generation.ts:99-101` | Self-review checklist item: "Task contracts defined for all dependent task pairs" | Prompt-only |

**Enforcement:** None. No runtime validation parses a generated plan to verify DAG contracts exist. Atlas prompt tests verify specific strings exist in prompt text, but no test validates plan output against contract requirements.

---

### Invariant 4: Multidimensional review (Telamon → Momus ordering)

**Source:** NORTH_STAR.md:15,23-24  
**Classification:** **Prompt-only** — with a **gap**: Telamon is never actually invoked in the Prometheus workflow  

**Evidence:**

| Surface | What it does | Classification |
|---------|-------------|----------------|
| NORTH_STAR.md:15 | "Process review (Momus) checks executability. Purpose review (Telamon) checks whether the output will contain insight" | Doc-only |
| NORTH_STAR.md:24 | "Plans are validated for purpose before process (Telamon → Momus)" | Doc-only |
| `src/agents/telamon.ts:94` | Telamon prompt: "Proceed to Momus for process review" | Prompt-only |
| `src/agents/telamon.ts:134` | Telamon description: "Insert between Prometheus plan generation and Momus process review" | Prompt-only |
| `src/agents/telamon.ts:157` | Telamon metadata: "After Prometheus creates a work plan, BEFORE Momus process review" | Prompt-only |
| `src/agents/prometheus/plan-generation.ts` | The actual plan generation workflow | — |

**The critical finding:** Prometheus plan generation (`plan-generation.ts`) defines the workflow as:
```
Metis → Oracle phase-1 → Generate → Oracle phase-2 → Self-review → Present → Oracle phase-3 → Momus (high-accuracy only)
```

Telamon is **never mentioned** in the Prometheus plan generation workflow. There is:
- No Telamon todo step
- No Telamon invocation in the workflow description
- No reference to Telamon in any Prometheus prompt file

**Telamon is registered** as a built-in agent (`src/agents/builtin-agents.ts:42`) and available via `call_omo_agent` or `task(subagent_type="telamon")`, but no orchestration path invokes it.

**Enforcement:** None. Telamon exists as a definition but is not wired into any workflow. The Prometheus plan generation goes directly from generation to self-review to optional-Momus, skipping the Telamon step entirely.

---

### Invariant 5: Self-correcting orchestration loop (Explore early-exit, Oracle→Atlas, memory tiers)

**Source:** NORTH_STAR.md:23-28  
**Classification:** **Doc-only** / **Prompt-only**  

| Invariant Sub-point | Classification | Evidence |
|--------------------|---------------|----------|
| Plans validated for purpose before process (Telamon → Momus) | Prompt-only, **never actually invoked** | See Invariant 4 |
| Research stops when confidence high (Explore early-exit) | Doc-only / Prompt-only (appears in Explore agent prompt if present) | No runtime enforcement or tests |
| Debugging produces structured handoffs (Oracle → Atlas) | Prompt-only | Atlas prompts describe this; no runtime enforcement |
| Reviews check security, compliance, completion | Doc-only | Not implemented in any agent or hook |
| Learnings persisted across sessions (memory tiers) | Doc-only | Aspirational; no implementation found |

---

## Gaps Summary

| # | Invariant | Prompts Reference It? | Tests? | Runtime Gates? | Gap Severity |
|---|-----------|----------------------|--------|----------------|-------------|
| 1 | `implementation_handoff` | Yes (Atlas, Oracle) | No | No | **Medium** — important pattern, no enforcement |
| 2 | Knowledge trust tiers | Yes (policy-sections, prompt-builder) | No | No | **Low** — advisory text already present; enforcement would be complex |
| 3 | Plans as DAG with contracts | Yes (Prometheus prompts) | No | No | **Low** — plan template structure is self-enforcing to some degree |
| 4 | Telamon → Momus ordering | Telamon describes itself as pre-Momus; **Prometheus workflow never calls Telamon** | No | No | **HIGH** — NORTH_STAR's headline invariant is not in the actual workflow |
| 5 | Self-correcting loop | Partial | No | No | **Medium** — multiple aspirational sub-points with zero implementation |

---

## Recommendations by Priority

### P0: Wire Telamon into Prometheus plan generation (gap #4)

Telamon is defined, registered, and has a complete prompt — but the Prometheus plan generation workflow never invokes it. The workflow should insert a Telamon step between plan generation (plan-2) and Momus review (plan-7/plan-8):

1. Add a `plan-2c` todo step in `plan-generation.ts` for "Submit to Telamon for purpose-fitness review"
2. Add a Telamon invocation pattern similar to the Oracle phase gates
3. If Telamon returns ITERATE, require plan reframing before proceeding to Momus

### P1: Add test coverage for Telamon

- Unit test for Telamon input extraction (single `.omo/plans/*.md` path)
- Integration test verifying Telamon is registered as a built-in agent with expected tool restrictions (read-only, no write/edit/task)

### P2: Audit invariant #1 (`implementation_handoff`) for test gaps

- Verify Atlas tests don't just check prompt text but also assert handoff consumption behavior
- Add a runtime test that simulates handoff and verifies re-research is rejected

### P3: Knowledge trust hierarchy (invariant #2)

Consider whether runtime enforcement is actually desired. The trust hierarchy is advisory by nature — classifying sources requires judgment. If enforcement is desired, it would need to be a hook-level check similar to `prometheus-md-only`.

---

## Files Examined

| File | Relevance |
|------|-----------|
| `NORTH_STAR.md` | Original invariant declarations |
| `src/agents/telamon.ts` | Telamon agent definition and prompt |
| `src/agents/prometheus/plan-generation.ts` | Prometheus plan generation workflow (should invoke Telamon) |
| `src/agents/prometheus/high-accuracy-mode.ts` | Momus review loop (no Telamon reference) |
| `src/agents/dynamic-agent-policy-sections.ts` | `buildKnowledgeTrustSection()` |
| `src/tools/delegate-task/prompt-builder.ts` | `KNOWLEDGE_TRUST_PREAMBLE` |
| `src/hooks/rules-injector/constants.ts` | Lists NORTH_STAR.md as rule file |
| `src/agents/momus.ts` | Momus agent (Telamon's downstream partner) |
| `src/agents/builtin-agents.ts` | Agent registry (Telamon registered here) |
| `src/agents/atlas/default-prompt-sections.ts` | `implementation_handoff` references |
| `src/agents/oracle.ts` | `implementation_handoff` origin |

**Tests examined:** `src/agents/telamon.test.ts` (does not exist), `src/agents/momus.test.ts` (exists, no Telamon references), `src/agents/atlas/atlas-prompt.test.ts` (exists, no Telamon references), `src/agents/dynamic-agent-policy-sections.test.ts` (does not exist), `src/tools/delegate-task/tools.test.ts` (exists, no Telamon references).
