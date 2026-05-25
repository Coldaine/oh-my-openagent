import type {
  DelegatedModelConfig as CoreDelegatedModelConfig,
  PipelineModelResolutionRequest as CoreModelResolutionRequest,
  PipelineModelResolutionProvenance as CoreModelResolutionProvenance,
  PipelineModelResolutionResult as CoreModelResolutionResult,
} from "@oh-my-opencode/model-core"

export type DelegatedModelConfig = CoreDelegatedModelConfig

export type ModelResolutionRequest = Omit<CoreModelResolutionRequest, 'intent'> & {
  intent?: Omit<NonNullable<CoreModelResolutionRequest['intent']>, 'userModel' | 'categoryDefaultModel'> & {
    userModel?: string | string[]
    categoryDefaultModel?: string | string[]
    categoryName?: string
    agentName?: string
  }
}

export type ModelResolutionProvenance = CoreModelResolutionProvenance
export type ModelResolutionResult = CoreModelResolutionResult
