import type { AutoRetryHelpers } from "./auto-retry"
import type { HookDeps, FallbackState } from "./types"
import { HOOK_NAME } from "./constants"
import { log } from "../../shared/logger"
import { prepareFallback } from "./fallback-state"
import { SessionCategoryRegistry } from "../../shared/session-category-registry"
import { appendModelSelectionEvent, createModelSelectionEvent } from "../../tools/delegate-task/model-selection-events"

type DispatchFallbackRetryOptions = {
  sessionID: string
  state: FallbackState
  fallbackModels: string[]
  resolvedAgent?: string
  source: string
}


function recordRuntimeFallbackSelection(options: DispatchFallbackRetryOptions, fallbackModel: string): void {
  const category = SessionCategoryRegistry.get(options.sessionID)
  const dispatchKind = category ? "category" : "direct_agent"

  try {
    appendModelSelectionEvent(createModelSelectionEvent({
      sessionID: options.sessionID,
      dispatchKind,
      ...(category ? { category } : { agent: options.resolvedAgent ?? "unknown" }),
      candidatePool: options.fallbackModels,
      selectedModel: fallbackModel,
      fallbackInvoked: true,
      fallbackModel,
      selectionReason: `runtime fallback selected by ${options.source}`,
    }))
  } catch (error) {
    log(`[${HOOK_NAME}] Failed to record fallback model selection event`, {
      sessionID: options.sessionID,
      source: options.source,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function dispatchFallbackRetry(
  deps: HookDeps,
  helpers: AutoRetryHelpers,
  options: DispatchFallbackRetryOptions,
): Promise<void> {
  const result = prepareFallback(
    options.sessionID,
    options.state,
    options.fallbackModels,
    deps.config,
  )

  if (result.success && deps.config.notify_on_fallback) {
    await deps.ctx.client.tui
      .showToast({
        body: {
          title: "Model Fallback",
          message: `Switching to ${result.newModel?.split("/").pop() || result.newModel} for next request`,
          variant: "warning",
          duration: 5000,
        },
      })
      .catch(() => {})
  }

  if (result.success && result.newModel) {
    recordRuntimeFallbackSelection(options, result.newModel)
    await helpers.autoRetryWithFallback(
      options.sessionID,
      result.newModel,
      options.resolvedAgent,
      options.source,
    )
    return
  }

  log(`[${HOOK_NAME}] Fallback preparation failed`, {
    sessionID: options.sessionID,
    source: options.source,
    error: result.error,
  })
}
