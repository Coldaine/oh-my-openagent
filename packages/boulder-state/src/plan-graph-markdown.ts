import type { PlanGraph, PlanGraphTask, PlanGraphTaskSection, PlanGraphTaskStatus } from "./plan-graph-types"

const TODO_HEADING_PATTERN = /^##\s+TODOs\b/i
const FINAL_VERIFICATION_HEADING_PATTERN = /^##\s+Final Verification Wave\b/i
const SECOND_LEVEL_HEADING_PATTERN = /^##\s+/
const CHECKBOX_PATTERN = /^[-*]\s*\[([ xX~])\]\s*(.+)$/
const TODO_TASK_PATTERN = /^(\d+)\.\s+(.+)$/
const FINAL_WAVE_TASK_PATTERN = /^(F\d+)\.\s+(.+)$/i

type ParseSection = PlanGraphTaskSection | "other"

function statusFromMarker(marker: string): PlanGraphTaskStatus {
  if (marker === "x" || marker === "X") return "completed"
  if (marker === "~") return "blocked"
  return "pending"
}

function buildTask(section: PlanGraphTaskSection, marker: string, body: string, wave: number): PlanGraphTask | null {
  const pattern = section === "todo" ? TODO_TASK_PATTERN : FINAL_WAVE_TASK_PATTERN
  const match = body.match(pattern)
  if (!match) return null

  const rawLabel = match[1]
  const label = section === "final-wave" ? rawLabel.toUpperCase() : rawLabel
  return {
    id: `${section}:${label}`,
    title: match[2].trim(),
    status: statusFromMarker(marker),
    wave,
    section,
    label,
    skills: [],
    blockedBy: [],
    blocks: [],
    references: [],
    qaEvidencePaths: [],
  }
}

export function parseMarkdownPlanGraph(content: string, planPath?: string): PlanGraph {
  const tasks: PlanGraphTask[] = []
  const lines = content.split(/\r?\n/)
  let section: ParseSection = "other"

  for (const line of lines) {
    if (SECOND_LEVEL_HEADING_PATTERN.test(line)) {
      section = TODO_HEADING_PATTERN.test(line)
        ? "todo"
        : FINAL_VERIFICATION_HEADING_PATTERN.test(line)
          ? "final-wave"
          : "other"
      continue
    }

    if (section === "other") continue
    const checkbox = line.match(CHECKBOX_PATTERN)
    if (!checkbox) continue

    const task = buildTask(section, checkbox[1], checkbox[2].trim(), tasks.length + 1)
    if (task) tasks.push(task)
  }

  return { version: 1, planPath, tasks }
}
