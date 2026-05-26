export type PlanGraphTaskStatus = "pending" | "in_progress" | "completed" | "blocked"
export type PlanGraphTaskSection = "todo" | "final-wave"
export type PlanGraphSource = "embedded" | "markdown"

export interface PlanGraphTask {
  id: string
  title: string
  status: PlanGraphTaskStatus
  wave: number
  section: PlanGraphTaskSection
  label: string
  category?: string
  skills: string[]
  blockedBy: string[]
  blocks: string[]
  references: string[]
  qaEvidencePaths: string[]
  promptSummary?: string
}

export interface PlanGraph {
  version: 1
  planPath?: string
  tasks: PlanGraphTask[]
}

export interface PlanGraphBlockedTask {
  id: string
  reason: string
  blockedBy: string[]
}

export interface PlanGraphProgress {
  total: number
  completed: number
  remaining: number
  isComplete: boolean
}

export interface PlanGraphParseResult {
  source: PlanGraphSource
  graph: PlanGraph
  readyBatch: PlanGraphTask[]
  blockedTasks: PlanGraphBlockedTask[]
  completedTasks: PlanGraphTask[]
  warnings: string[]
  progress: PlanGraphProgress
}
