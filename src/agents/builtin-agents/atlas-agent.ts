import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoriesConfig, CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS } from "../../shared"
import { applyOverrides } from "./agent-overrides"
import { applyModelResolution } from "./model-resolution"
import { createAtlasAgent } from "../atlas"

export function maybeCreateAtlasConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  uiSelectedModel?: string
  availableModels: Set<string>
  systemDefaultModel?: string
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
  useTaskSystem?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    availableAgents,
    availableSkills,
    mergedCategories,
    directory,
    userCategories,
  } = input

  if (disabledAgents.includes("atlas")) return undefined

  const orchestratorOverride = agentOverrides["atlas"]
  const atlasRequirement = AGENT_MODEL_REQUIREMENTS["atlas"]
  const atlasOverrideModel = typeof orchestratorOverride?.model === "string"
    ? orchestratorOverride.model
    : undefined

  let atlasResolution = applyModelResolution({
    uiSelectedModel: atlasOverrideModel !== undefined ? undefined : uiSelectedModel,
    userModel: atlasOverrideModel,
    agentName: "atlas",
    requirement: atlasRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (!atlasResolution && orchestratorOverride?.model) {
    // User explicitly configured a model but resolution failed (e.g., cold cache, no system default).
    // Honor the user's choice directly instead of dropping Atlas entirely.
    const resolvedModel = typeof orchestratorOverride.model === "string"
      ? orchestratorOverride.model
      : orchestratorOverride.model[0]
    if (resolvedModel) {
      atlasResolution = { model: resolvedModel, provenance: "override" as const }
    }
  }

  if (!atlasResolution) return undefined
  const { model: atlasModel, variant: atlasResolvedVariant } = atlasResolution

  let orchestratorConfig = createAtlasAgent({
    model: atlasModel,
    availableAgents,
    availableSkills,
    userCategories,
  })

  if (atlasResolvedVariant) {
    orchestratorConfig = { ...orchestratorConfig, variant: atlasResolvedVariant }
  }

  orchestratorConfig = applyOverrides(orchestratorConfig, orchestratorOverride, mergedCategories, directory)

  return orchestratorConfig
}
