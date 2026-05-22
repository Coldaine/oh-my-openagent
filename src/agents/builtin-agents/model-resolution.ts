import { resolveModelPipeline } from "../../shared"
import { transformModelForProvider } from "../../shared/provider-model-id-transform"

export function applyModelResolution(input: {
  uiSelectedModel?: string
  userModel?: string | string[]
  agentName?: string
  requirement?: { fallbackChain?: { providers: string[]; model: string; variant?: string }[] }
  availableModels: Set<string>
  systemDefaultModel?: string
}) {
  const { uiSelectedModel, userModel, agentName, requirement, availableModels, systemDefaultModel } = input
  return resolveModelPipeline({
    intent: { uiSelectedModel, userModel, agentName },
    constraints: { availableModels },
    policy: { fallbackChain: requirement?.fallbackChain, systemDefaultModel },
  })
}

export function getFirstFallbackModel(requirement?: {
  fallbackChain?: { providers: string[]; model: string; variant?: string }[]
}) {
  const entry = requirement?.fallbackChain?.[0]
  if (!entry || entry.providers.length === 0) return undefined
  const provider = entry.providers[0]
  const transformedModel = transformModelForProvider(provider, entry.model)
  return {
    model: `${provider}/${transformedModel}`,
    provenance: "provider-fallback" as const,
    variant: entry.variant,
  }
}
