import { constants, mkdirSync, openSync, writeFileSync, writeSync, closeSync } from "node:fs"
import { dirname, join } from "node:path"

const SECURE_DIR_MODE = 0o700
const SECURE_FILE_MODE = 0o600
const DEFAULT_EVENTS_FILE = join(process.cwd(), ".omo", "evidence", "model-selection", "events.jsonl")

export interface ModelSelectionEvent {
  timestamp: string
  sessionID?: string
  dispatchKind: "category" | "direct_agent"
  category?: string
  agent?: string
  strategy: "round_robin"
  candidatePool: string[]
  selectedModel: string
  skippedModels?: Array<{ model: string; reason: string }>
  fallbackInvoked?: boolean
  fallbackModel?: string
  selectionReason: string
}

export type CreateModelSelectionEventInput = Omit<ModelSelectionEvent, "timestamp" | "strategy"> & {
  timestamp?: string
  strategy?: "round_robin"
}

export function getDefaultModelSelectionEventsPath(): string {
  return DEFAULT_EVENTS_FILE
}

export function createModelSelectionEvent(input: CreateModelSelectionEventInput): ModelSelectionEvent {
  const event: ModelSelectionEvent = {
    timestamp: input.timestamp ?? new Date().toISOString(),
    dispatchKind: input.dispatchKind,
    strategy: input.strategy ?? "round_robin",
    candidatePool: [...input.candidatePool],
    selectedModel: input.selectedModel,
    selectionReason: input.selectionReason,
  }

  if (input.sessionID !== undefined) event.sessionID = input.sessionID
  if (input.category !== undefined) event.category = input.category
  if (input.agent !== undefined) event.agent = input.agent
  if (input.skippedModels !== undefined && input.skippedModels.length > 0) {
    event.skippedModels = input.skippedModels.map((skipped) => ({ ...skipped }))
  }
  if (input.fallbackInvoked !== undefined) event.fallbackInvoked = input.fallbackInvoked
  if (input.fallbackModel !== undefined) event.fallbackModel = input.fallbackModel

  return event
}

export function appendModelSelectionEvent(
  event: ModelSelectionEvent,
  filePath = getDefaultModelSelectionEventsPath(),
): void {
  mkdirSync(dirname(filePath), { recursive: true, mode: SECURE_DIR_MODE })
  const fd = openSync(
    filePath,
    constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT,
    SECURE_FILE_MODE,
  )
  try {
    writeSync(fd, JSON.stringify(event) + "\n")
  } finally {
    closeSync(fd)
  }
}

export function resetModelSelectionEvents(filePath = getDefaultModelSelectionEventsPath()): void {
  mkdirSync(dirname(filePath), { recursive: true, mode: SECURE_DIR_MODE })
  writeFileSync(filePath, "", { mode: SECURE_FILE_MODE })
}
