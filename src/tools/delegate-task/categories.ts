import type { CategoryConfig, CategoriesConfig } from "../../config/schema"
import { DEFAULT_CATEGORIES, CATEGORY_PROMPT_APPENDS } from "./constants"
import { resolveModel } from "../../shared/model-resolver"
import { isModelAvailable } from "../../shared/model-availability"
import { normalizeModel } from "../../shared/model-normalization"
import { CATEGORY_MODEL_REQUIREMENTS } from "../../shared/model-requirements"
import { log } from "../../shared/logger"
import { isModelAvailable as isPoolModelAvailable, nextModel } from "../../shared/model-pool-state"
import { appendModelSelectionEvent, createModelSelectionEvent } from "./model-selection-events"

function recordCategoryModelSelection(categoryName: string, candidatePool: string[], selectedModel: string, selectionReason: string): void {
  try {
    appendModelSelectionEvent(createModelSelectionEvent({
      dispatchKind: "category",
      category: categoryName,
      candidatePool,
      selectedModel,
      skippedModels: candidatePool
        .filter((model) => model !== selectedModel && !isPoolModelAvailable(model))
        .map((model) => ({ model, reason: "marked unavailable" })),
      fallbackInvoked: false,
      selectionReason,
    }))
  } catch (error) {
    log("[delegate-task] Failed to record category model selection event", {
      category: categoryName,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

function selectCategoryPoolModel(categoryName: string, pool: string[], selectionReason: string): string | undefined {
  const selectedModel = nextModel("category", categoryName, pool)
  if (selectedModel === undefined) {
    return undefined
  }
  recordCategoryModelSelection(categoryName, pool, selectedModel, selectionReason)
  return selectedModel
}

function resolveConfiguredCategoryModel(
  categoryName: string,
  configuredModel: string | string[] | undefined,
  selectionReason: string,
): string | undefined {
  if (Array.isArray(configuredModel)) {
    return selectCategoryPoolModel(categoryName, configuredModel, selectionReason)
  }

  if (typeof configuredModel === "string" && configuredModel.trim().length > 0) {
    return configuredModel
  }

  return undefined
}

function buildCategoryPromptAppend(defaultPromptAppend: string, userPromptAppend: string | undefined): string {
  if (!userPromptAppend) {
    return defaultPromptAppend
  }

  return defaultPromptAppend
    ? `${defaultPromptAppend}\n\n${userPromptAppend}`
    : userPromptAppend
}

export interface ResolveCategoryConfigOptions {
  userCategories?: CategoriesConfig
  inheritedModel?: string
  systemDefaultModel?: string
  availableModels?: Set<string>
}

export interface ResolveCategoryConfigResult {
  config: CategoryConfig
  promptAppend: string
  model: string | undefined
  isUserConfiguredModel: boolean
}

/**
 * Resolve the configuration for a given category name.
 * Merges default and user configurations, handles model resolution.
 */
export function resolveCategoryConfig(
  categoryName: string,
  options: ResolveCategoryConfigOptions
): ResolveCategoryConfigResult | null {
  const { userCategories, inheritedModel: _inheritedModel, systemDefaultModel, availableModels } = options

  const defaultConfig = DEFAULT_CATEGORIES[categoryName]
  const userConfig = userCategories?.[categoryName]
  const hasExplicitUserConfig = userConfig !== undefined

  if (userConfig?.disable) {
    return null
  }

  const categoryReq = CATEGORY_MODEL_REQUIREMENTS[categoryName]
  if (categoryReq?.requiresModel && availableModels && !hasExplicitUserConfig) {
    if (!isModelAvailable(categoryReq.requiresModel, availableModels)) {
      log(`[resolveCategoryConfig] Category ${categoryName} requires ${categoryReq.requiresModel} but not available`)
      return null
    }
  }
  const defaultPromptAppend = CATEGORY_PROMPT_APPENDS[categoryName] ?? ""

  if (!defaultConfig && !userConfig) {
    return null
  }

  // Model priority for categories: user override > category default > system default.
  // Categories have explicit models - no inheritance from parent session.
  const userModel = resolveConfiguredCategoryModel(
    categoryName,
    userConfig?.model,
    "round-robin selected configured category model pool entry",
  )
  const defaultModel = resolveConfiguredCategoryModel(
    categoryName,
    defaultConfig?.model,
    "round-robin selected default category model pool entry",
  )
  const model = resolveModel({
    userModel,
    inheritedModel: defaultModel, // Category's built-in model takes precedence over system default
    systemDefault: systemDefaultModel,
  })
  const isUserConfiguredModel = userModel !== undefined
  const config: CategoryConfig = {
    ...defaultConfig,
    ...userConfig,
    model,
    variant: userConfig?.variant ?? defaultConfig?.variant,
  }

  const promptAppend = buildCategoryPromptAppend(defaultPromptAppend, userConfig?.prompt_append)

  return { config, promptAppend, model, isUserConfiguredModel }
}
