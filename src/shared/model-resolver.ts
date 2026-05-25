import {
	resolveModel,
	resolveModelWithFallback as resolveModelWithFallbackFromCore,
	normalizeFallbackModels,
	flattenToFallbackModelStrings,
} from "@oh-my-opencode/model-core"
import type {
	ModelResolutionInput,
	ExtendedModelResolutionInput as CoreExtendedModelResolutionInput,
} from "@oh-my-opencode/model-core"
import * as connectedProvidersCache from "./connected-providers-cache"

export { resolveModel, normalizeFallbackModels, flattenToFallbackModelStrings }

type CoreModelResolutionResult = ReturnType<typeof resolveModelWithFallbackFromCore>
export type ModelResolutionResult = Exclude<CoreModelResolutionResult, undefined>
export type ModelSource = ModelResolutionResult["source"]

export type ExtendedModelResolutionInput = Omit<CoreExtendedModelResolutionInput, 'userModel' | 'categoryDefaultModel'> & {
	userModel?: string | string[]
	categoryDefaultModel?: string | string[]
	categoryName?: string
	agentName?: string
}

export function resolveModelWithFallback(
	input: ExtendedModelResolutionInput,
): CoreModelResolutionResult {
	return resolveModelWithFallbackFromCore(input as any, connectedProvidersCache)
}

export type {
	ModelResolutionInput,
}
