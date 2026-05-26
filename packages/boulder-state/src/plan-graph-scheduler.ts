import type { PlanGraph, PlanGraphBlockedTask, PlanGraphProgress, PlanGraphTask } from "./plan-graph-types"

function isFinished(task: PlanGraphTask): boolean {
  return task.status === "completed"
}

function getProgress(tasks: PlanGraphTask[]): PlanGraphProgress {
  const completed = tasks.filter(isFinished).length
  const remaining = tasks.length - completed
  return {
    total: tasks.length,
    completed,
    remaining,
    isComplete: tasks.length > 0 && remaining === 0,
  }
}

function buildCompletedIds(tasks: PlanGraphTask[]): Set<string> {
  return new Set(tasks.filter(isFinished).map((task) => task.id))
}

function getIncompleteImplementationIds(tasks: PlanGraphTask[]): string[] {
  return tasks
    .filter((task) => task.section === "todo" && !isFinished(task))
    .map((task) => task.id)
}

function getBlockingReason(task: PlanGraphTask, completedIds: Set<string>, tasks: PlanGraphTask[]): PlanGraphBlockedTask | null {
  if (task.status === "completed") return null
  if (task.status === "blocked") {
    return { id: task.id, reason: "task-marked-blocked", blockedBy: task.blockedBy }
  }

  const taskIds = new Set(tasks.map((candidate) => candidate.id))
  const missingBlockers = task.blockedBy.filter((blockerId) => !taskIds.has(blockerId))
  if (missingBlockers.length > 0) {
    return { id: task.id, reason: "unknown-blocker", blockedBy: missingBlockers }
  }

  const incompleteBlockers = task.blockedBy.filter((blockerId) => !completedIds.has(blockerId))
  if (incompleteBlockers.length > 0) {
    return { id: task.id, reason: "waiting-for-dependencies", blockedBy: incompleteBlockers }
  }

  if (task.section === "final-wave") {
    const incompleteImplementationIds = getIncompleteImplementationIds(tasks)
    if (incompleteImplementationIds.length > 0) {
      return {
        id: task.id,
        reason: "final-wave-waits-for-implementation",
        blockedBy: incompleteImplementationIds,
      }
    }
  }

  return null
}

export function computePlanGraphSchedule(graph: PlanGraph): {
  readyBatch: PlanGraphTask[]
  blockedTasks: PlanGraphBlockedTask[]
  completedTasks: PlanGraphTask[]
  progress: PlanGraphProgress
} {
  const tasks = graph.tasks
  const completedIds = buildCompletedIds(tasks)
  const blockedTasks = tasks
    .map((task) => getBlockingReason(task, completedIds, tasks))
    .filter((blockedTask): blockedTask is PlanGraphBlockedTask => blockedTask !== null)
  const blockedIds = new Set(blockedTasks.map((task) => task.id))
  const unfinishedTasks = tasks.filter((task) => !isFinished(task))

  const lowestUnfinishedWave = unfinishedTasks.reduce<number | null>(
    (lowestWave, task) => lowestWave === null || task.wave < lowestWave ? task.wave : lowestWave,
    null,
  )
  const readyBatch = lowestUnfinishedWave === null
    ? []
    : unfinishedTasks.filter((task) => task.wave === lowestUnfinishedWave && !blockedIds.has(task.id))

  return {
    readyBatch,
    blockedTasks,
    completedTasks: tasks.filter(isFinished),
    progress: getProgress(tasks),
  }
}

export function sortPlanGraphTasksTopologically(graph: PlanGraph): PlanGraphTask[] {
  const byId = new Map(graph.tasks.map((task) => [task.id, task]))
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const sortedTasks: PlanGraphTask[] = []
  const orderedTasks = [...graph.tasks].sort((left, right) => {
    if (left.wave !== right.wave) return left.wave - right.wave
    return graph.tasks.indexOf(left) - graph.tasks.indexOf(right)
  })

  function visit(task: PlanGraphTask): void {
    if (visited.has(task.id)) return
    if (visiting.has(task.id)) return

    visiting.add(task.id)
    for (const blockerId of task.blockedBy) {
      const blocker = byId.get(blockerId)
      if (blocker) visit(blocker)
    }
    visiting.delete(task.id)
    visited.add(task.id)
    sortedTasks.push(task)
  }

  for (const task of orderedTasks) {
    visit(task)
  }

  return sortedTasks
}
