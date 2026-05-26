import { existsSync, readFileSync } from "node:fs"

import { parseMarkdownPlanGraph } from "./plan-graph-markdown"
import { computePlanGraphSchedule } from "./plan-graph-scheduler"
import type { PlanGraph, PlanGraphParseResult, PlanGraphTask, PlanGraphTaskStatus } from "./plan-graph-types"

const GRAPH_HEADING_PATTERN = /^##\s+Machine-Readable Plan Graph\b/i
const SECOND_LEVEL_HEADING_PATTERN = /^##\s+/
const FENCE_PATTERN = /^```(?:json)?\s*$/i
const END_FENCE_PATTERN = /^```\s*$/
const TODO_ID_PATTERN = /^todo:(\d+)$/
const FINAL_WAVE_ID_PATTERN = /^final-wave:(F\d+)$/i
const TASK_STATUSES = new Set<PlanGraphTaskStatus>(["pending", "in_progress", "completed", "blocked"])

type ParseOptions = {
  planPath?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function normalizeTaskId(value: unknown): { id: string; section: PlanGraphTask["section"]; label: string } | null {
  if (typeof value !== "string") return null

  const todoMatch = value.match(TODO_ID_PATTERN)
  if (todoMatch) {
    return { id: `todo:${todoMatch[1]}`, section: "todo", label: todoMatch[1] }
  }

  const finalWaveMatch = value.match(FINAL_WAVE_ID_PATTERN)
  if (finalWaveMatch) {
    const label = finalWaveMatch[1].toUpperCase()
    return { id: `final-wave:${label}`, section: "final-wave", label }
  }

  return null
}

function normalizeStatus(value: unknown): PlanGraphTaskStatus {
  return typeof value === "string" && TASK_STATUSES.has(value as PlanGraphTaskStatus)
    ? value as PlanGraphTaskStatus
    : "pending"
}

function normalizeWave(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback
}

function extractEmbeddedGraphJson(content: string): string | null {
  const lines = content.split(/\r?\n/)
  const headingIndex = lines.findIndex((line) => GRAPH_HEADING_PATTERN.test(line))
  if (headingIndex < 0) return null

  const fenceStart = lines.findIndex((line, index) => index > headingIndex && FENCE_PATTERN.test(line))
  if (fenceStart >= 0) {
    const fenceEnd = lines.findIndex((line, index) => index > fenceStart && END_FENCE_PATTERN.test(line))
    if (fenceEnd > fenceStart) {
      return lines.slice(fenceStart + 1, fenceEnd).join("\n").trim()
    }
    return lines.slice(fenceStart + 1).join("\n").trim()
  }

  const blockLines: string[] = []
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (SECOND_LEVEL_HEADING_PATTERN.test(line)) break
    if (line.trim() || blockLines.length > 0) blockLines.push(line)
  }

  const rawBlock = blockLines.join("\n").trim()
  return rawBlock ? rawBlock : null
}

function getTaskRecords(parsed: unknown): unknown[] {
  if (!isRecord(parsed)) return []
  if (Array.isArray(parsed.tasks)) return parsed.tasks
  if (isRecord(parsed.graph) && Array.isArray(parsed.graph.tasks)) return parsed.graph.tasks
  return []
}

function normalizeEmbeddedTasks(parsed: unknown, warnings: string[]): PlanGraphTask[] {
  const seenIds = new Set<string>()
  const tasks: PlanGraphTask[] = []

  for (const [index, entry] of getTaskRecords(parsed).entries()) {
    if (!isRecord(entry)) {
      warnings.push(`Graph task at index ${index} is not an object.`)
      continue
    }

    const idParts = normalizeTaskId(entry.id)
    const title = optionalString(entry.title)
    if (!idParts || !title) {
      warnings.push(`Graph task at index ${index} is missing a valid id or title.`)
      continue
    }
    if (seenIds.has(idParts.id)) {
      warnings.push(`Graph contains duplicate task id ${idParts.id}.`)
      continue
    }
    seenIds.add(idParts.id)

    tasks.push({
      id: idParts.id,
      title,
      status: normalizeStatus(entry.status),
      wave: normalizeWave(entry.wave, index + 1),
      section: idParts.section,
      label: idParts.label,
      category: optionalString(entry.category),
      skills: stringArray(entry.skills),
      blockedBy: stringArray(entry.blockedBy),
      blocks: stringArray(entry.blocks),
      references: stringArray(entry.references),
      qaEvidencePaths: stringArray(entry.qaEvidencePaths),
      promptSummary: optionalString(entry.promptSummary),
    })
  }

  return withDerivedBlocks(tasks)
}

function withDerivedBlocks(tasks: PlanGraphTask[]): PlanGraphTask[] {
  const blocksById = new Map(tasks.map((task) => [task.id, new Set(task.blocks)]))
  for (const task of tasks) {
    for (const blockerId of task.blockedBy) {
      blocksById.get(blockerId)?.add(task.id)
    }
  }

  return tasks.map((task) => ({
    ...task,
    blocks: [...(blocksById.get(task.id) ?? new Set<string>())],
  }))
}

function compareGraphToMarkdown(graph: PlanGraph, markdownGraph: PlanGraph): string[] {
  const warnings: string[] = []
  const graphTasks = new Map(graph.tasks.map((task) => [task.id, task]))
  const markdownTasks = new Map(markdownGraph.tasks.map((task) => [task.id, task]))

  for (const markdownTask of markdownGraph.tasks) {
    const graphTask = graphTasks.get(markdownTask.id)
    if (!graphTask) {
      warnings.push(`Graph is missing Markdown task ${markdownTask.id}.`)
      continue
    }
    if (graphTask.title !== markdownTask.title) {
      warnings.push(`Graph task ${graphTask.id} title "${graphTask.title}" does not match Markdown title "${markdownTask.title}".`)
    }
    if (graphTask.status !== markdownTask.status) {
      warnings.push(`Graph task ${graphTask.id} status "${graphTask.status}" does not match Markdown status "${markdownTask.status}".`)
    }
  }

  for (const graphTask of graph.tasks) {
    if (!markdownTasks.has(graphTask.id)) {
      warnings.push(`Graph task ${graphTask.id} has no matching Markdown checkbox.`)
    }
  }

  return warnings
}

function buildResult(source: "embedded" | "markdown", graph: PlanGraph, warnings: string[]): PlanGraphParseResult {
  const schedule = computePlanGraphSchedule(graph)
  return {
    source,
    graph,
    ...schedule,
    warnings,
  }
}

export function parsePlanGraph(content: string, options: ParseOptions = {}): PlanGraphParseResult {
  const markdownGraph = parseMarkdownPlanGraph(content, options.planPath)
  const embeddedJson = extractEmbeddedGraphJson(content)
  if (!embeddedJson) {
    return buildResult("markdown", markdownGraph, [])
  }

  const warnings: string[] = []
  try {
    const parsed = JSON.parse(embeddedJson) as unknown
    const graph: PlanGraph = {
      version: 1,
      planPath: options.planPath,
      tasks: normalizeEmbeddedTasks(parsed, warnings),
    }
    warnings.push(...compareGraphToMarkdown(graph, markdownGraph))
    return buildResult("embedded", graph, warnings)
  } catch (error) {
    warnings.push(`Could not parse Machine-Readable Plan Graph JSON: ${error instanceof Error ? error.message : String(error)}`)
    return buildResult("markdown", markdownGraph, warnings)
  }
}

export function readPlanGraph(planPath: string): PlanGraphParseResult | null {
  if (!existsSync(planPath)) return null

  try {
    return parsePlanGraph(readFileSync(planPath, "utf-8"), { planPath })
  } catch {
    return null
  }
}

export type {
  PlanGraph,
  PlanGraphBlockedTask,
  PlanGraphParseResult,
  PlanGraphProgress,
  PlanGraphSource,
  PlanGraphTask,
  PlanGraphTaskSection,
  PlanGraphTaskStatus,
} from "./plan-graph-types"
export { computePlanGraphSchedule, sortPlanGraphTasksTopologically } from "./plan-graph-scheduler"
export { parseMarkdownPlanGraph } from "./plan-graph-markdown"
