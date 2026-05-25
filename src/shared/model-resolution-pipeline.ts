import {
  _setModelResolutionLogImplementationForTesting,
  resolveModelPipeline as resolveModelPipelineFromCore,
} from "@oh-my-opencode/model-core"
import type {
  PipelineModelResolutionResult,
} from "@oh-my-opencode/model-core"
import type { ModelResolutionRequest } from "./model-resolution-types"
import * as connectedProvidersCache from "./connected-providers-cache"
import { isModelPool } from "./model-pool-utils"
import { nextModel } from "./model-pool-state"
import { normalizeModel } from "./model-normalization"
import { log } from "./logger"

export { _setModelResolutionLogImplementationForTesting }

function resolvePool(
  model: string | string[] | undefined,
  categoryName?: string,
  agentName?: string,
): string | undefined {
  if (model === undefined) return undefined
  if (isModelPool(model)) {
    const scope = categoryName ? "category" : "agent"
    const name = categoryName ?? agentName ?? "unknown"
    const selected = nextModel(scope, name, model)
    if (selected) {
      log(`Model pool resolved for ${scope}:${name}`, { pool: model, selected })
      return selected
    }
  }
  return normalizeModel(model as string)
}

export function resolveModelPipeline(
  request: ModelResolutionRequest,
): PipelineModelResolutionResult | undefined {
  const processedRequest = {
    ...request,
    intent: request.intent
      ? {
          ...request.intent,
          userModel: resolvePool(request.intent.userModel, request.intent.categoryName, request.intent.agentName),
          categoryDefaultModel: resolvePool(request.intent.categoryDefaultModel, request.intent.categoryName, request.intent.agentName),
        }
      : undefined,
  }

  return resolveModelPipelineFromCore(processedRequest as any, connectedProvidersCache)
}

export type {
  PipelineModelResolutionProvenance as ModelResolutionProvenance,
  PipelineModelResolutionResult as ModelResolutionResult,
} from "@oh-my-opencode/model-core"
