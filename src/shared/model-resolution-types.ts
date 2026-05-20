import type { FallbackEntry } from "./model-requirements"

export interface DelegatedModelConfig {
  providerID: string
  modelID: string
  variant?: string
  reasoningEffort?: string
  temperature?: number
  top_p?: number
  maxTokens?: number
  thinking?: { type: "enabled" | "disabled"; budgetTokens?: number }
}

export type ModelResolutionRequest = {
  intent?: {
    uiSelectedModel?: string
    userModel?: string
    userFallbackModels?: string[]
    categoryDefaultModel?: string
    /** Resolved model from rotation pool; mutually exclusive with uiSelectedModel/userModel */
    rotationModel?: string
    /** Agent key used for rotation counter persistence */
    rotationAgentKey?: string
  }
  constraints: {
    availableModels: Set<string>
  }
  policy?: {
    fallbackChain?: FallbackEntry[]
    systemDefaultModel?: string
  }
}

export type ModelResolutionProvenance =
  | "override"
  | "rotation"
  | "category-default"
  | "provider-fallback"
  | "system-default"

export type ModelResolutionResult = {
  model: string
  provenance: ModelResolutionProvenance
  variant?: string
  attempted?: string[]
  reason?: string
}
