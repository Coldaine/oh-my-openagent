/**
 * Prometheus Pre-Mortem Phase
 *
 * Phase 1c: Forward-looking failure analysis conducted before plan generation.
 * Identifies what could go wrong, risk factors, and mitigation strategies
 * to improve plan robustness.
 */

export const PROMETHEUS_PRE_MORTEM = `## MANDATORY: Pre-Mortem Analysis (Before Plan Generation)

**AFTER Metis consultation, BEFORE generating the plan**, perform a pre-mortem analysis.
A pre-mortem asks: "It's 6 months from now and this plan failed spectacularly. What went wrong?"

### Pre-Mortem Process

Run this analysis using explore agents to gather evidence:

\`\`\`typescript
task(
  subagent_type="explore",
  load_skills=[],
  prompt="I am performing a pre-mortem risk analysis before planning [project]. Identify: 1) Known failure points in similar modules (git log for reverts, bug fixes, regressions). 2) Integration hotspots where changes are most likely to break. 3) Files with high churn or known technical debt that could derail timelines. 4) Dependency chains that create hidden coupling risks. Return: file paths + risk rating (critical/high/medium) + one-liner why.",
  run_in_background=true
)
\`\`\`

### Pre-Mortem Categories (Evaluate ALL)

For each category, document findings in the draft file:

#### 1. Technical Risks
- **Integration failure**: Will new code integrate cleanly with existing systems?
- **Performance regression**: Could changes introduce latency, memory, or throughput issues?
- **Hidden coupling**: Does the plan touch interfaces that other modules depend on?
- **Build/CI instability**: Could changes break the build pipeline or test suite?
- **Data integrity**: Are there migration, schema, or data loss risks?

#### 2. Process Risks
- **Scope creep**: What parts of the spec are most likely to expand?
- **Under-specification**: Which tasks lack concrete acceptance criteria?
- **Dependency chains**: What happens if a wave-1 task is delayed?
- **Knowledge gaps**: What are the team's blind spots in the tech stack?
- **Stale assumptions**: Which design decisions rely on unverified premises?

#### 3. External Risks
- **Third-party API changes**: What external services could change or go down?
- **Platform drift**: Are we targeting a platform version that may shift?
- **Regulatory/compliance**: Any legal or policy constraints we are missing?
- **Timeline pressure**: What gets cut when deadlines slip?

#### 4. AI-Slop Risks (CRITICAL)
- **Over-engineering**: Are we building abstractions before they are needed?
- **Premature optimization**: Are we optimizing for scale that does not exist?
- **Scope inflation**: Is each task staying within its defined boundary?
- **Vague acceptance criteria**: Are any criteria unverifiable by agents?
- **False parallelism**: Are tasks grouped as parallel when they have hidden serial dependencies?

### Mitigation Strategies

For each risk identified, document:

\`\`\`
Risk: [What could go wrong]
Category: [Technical / Process / External / AI-Slop]
Likelihood: [High / Medium / Low]
Impact: [Critical / Major / Minor]
Mitigation: [Specific action to prevent or contain]
Trigger: [What event would indicate this risk is materializing]
Contingency: [Fallback plan if risk materializes]
\`\`\`

### Integration into Plan

After pre-mortem analysis:

1. **Record findings** to \`.omo/drafts/{name}.md\` under a "Pre-Mortem" section
2. **Incorporate mitigations** into the plan:
   - Add guardrails to "Must NOT Have" for identified scope-creep risks
   - Add explicit contingency tasks for high-likelihood failure modes
   - Increase QA scenario coverage for high-risk integrations
   - Add rollback/recovery steps for critical-path risks
3. **Adjust task sizing** based on risk level:
   - High-risk tasks → split into smaller chunks with more checkpoints
   - Medium-risk tasks → add verification gates within the wave
   - Low-risk tasks → standard treatment

### Pre-Mortem Checklist

\`\`\`
□ All 4 risk categories evaluated (Technical, Process, External, AI-Slop)
□ Top 3 most likely failure modes identified with mitigations
□ At least one contingency task exists for each critical-risk area
□ Must NOT Have guardrails updated based on risk findings
□ QA scenarios increased for high-risk integration points
□ Scope boundaries reinforced against identified creep vectors
□ Pre-mortem findings recorded in draft file
\`\`\`

### What Pre-Mortem Is NOT

- **NOT** permission to add unnecessary complexity (resist over-engineering in mitigations)
- **NOT** a reason to delay plan generation (spend 1-2 explore calls, not exhaustive analysis)
- **NOT** a fear exercise (focus on probable, not possible, failure modes)
- **NOT** a substitute for Metis consultation (pre-mortem complements Metis gap analysis)

**A 5-minute pre-mortem prevents 5 hours of debugging. Do not skip it.**`
