import type { BuildSystemContentInput } from "./types"
import type { AvailableSkill } from "../../agents/dynamic-agent-prompt-builder"
import { buildPlanAgentSystemPrepend, isPlanAgent } from "./constants"
import { buildSystemContentWithTokenLimit } from "./token-limiter"

const FREE_OR_LOCAL_PROMPT_TOKEN_LIMIT = 24000

const INTENT_CHECK_PREAMBLE = `<intent_check>
Before executing the caller's request, briefly check: is the literal request asking for the right thing? If the actual need differs from the literal ask, note the gap and address the actual need. If uncertain, state your interpretation and proceed.
</intent_check>`
const PLAN_AGENT_PROMPT_BASE = `

Additional requirements for this planning request:
- Answer in English.
- Write the plan in English.
- Plan well for ultrawork execution.
- Include a clear atomic commit strategy.`

const TDD_LINE = "- Use TDD-oriented planning."

function buildPlanAgentPromptAppend(tddEnabled: boolean): string {
  if (tddEnabled) {
    return `${PLAN_AGENT_PROMPT_BASE}
${TDD_LINE}`
  }
  return PLAN_AGENT_PROMPT_BASE
}

function buildAvailableSkillsSection(skills: AvailableSkill[]): string {
  if (skills.length === 0) {
    return ""
  }

  const rows = skills
    .map((s) => `- \`${s.name}\`: ${s.description || s.name}`)
    .join("\n")

  return `<available_skills>
Skills provide specialized instructions. Load via load_skills parameter when delegating tasks.

${rows}
</available_skills>`
}

function usesFreeOrLocalModel(model: { providerID: string; modelID: string; variant?: string } | undefined): boolean {
  if (!model) {
    return false
  }

  const provider = model.providerID.toLowerCase()
  const modelId = model.modelID.toLowerCase()
  return provider.includes("local")
    || provider === "ollama"
    || provider === "lmstudio"
    || modelId.includes("free")
}

/**
 * Build the system content to inject into the agent prompt.
 * Combines skill content, category prompt append, and plan agent system prepend.
 */
export function buildSystemContent(input: BuildSystemContentInput): string | undefined {
  const {
    skillContent,
    skillContents,
    categoryPromptAppend,
    agentsContext,
    maxPromptTokens,
    model,
    agentName,
    availableCategories,
    availableSkills,
  } = input

  const isPlan = isPlanAgent(agentName)
  const planAgentPrepend = isPlan
    ? buildPlanAgentSystemPrepend(availableCategories, availableSkills)
    : ""

  const skillsSection = !isPlan
    ? buildAvailableSkillsSection(availableSkills ?? [])
    : ""

  const baseAgentsContext = agentsContext ?? planAgentPrepend
  const effectiveAgentsContext = [INTENT_CHECK_PREAMBLE, baseAgentsContext].filter(Boolean).join("\n\n")
  const finalAgentsContext = !isPlan && skillsSection
    ? [effectiveAgentsContext, skillsSection].filter(Boolean).join("\n\n")
    : effectiveAgentsContext

  const effectiveMaxPromptTokens = maxPromptTokens
    ?? (usesFreeOrLocalModel(model) ? FREE_OR_LOCAL_PROMPT_TOKEN_LIMIT : undefined)

  return buildSystemContentWithTokenLimit(
    {
      skillContent,
      skillContents,
      categoryPromptAppend,
      agentsContext: effectiveAgentsContext,
      planAgentPrepend,
    },
    effectiveMaxPromptTokens
  )
}

export function buildTaskPrompt(prompt: string, agentName: string | undefined, tddEnabled?: boolean): string {
  if (!isPlanAgent(agentName)) {
    return prompt
  }

  const effectiveTdd = tddEnabled ?? true
  return `${prompt}${buildPlanAgentPromptAppend(effectiveTdd)}`
}
