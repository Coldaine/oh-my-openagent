import { resolve } from "node:path"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"

import {
  getPlanName,
  readBoulderState,
  readPlanGraph,
  resolveBoulderPlanPath,
  type PlanGraphTask,
} from "../../features/boulder-state"

type PlanGraphStatusContext = Pick<PluginInput, "directory">

type PlanGraphStatusArgs = {
  planPath?: string
}

function resolvePlanPath(directory: string, planPath: string | undefined): string | null {
  if (planPath?.trim()) {
    return resolve(directory, planPath)
  }

  const state = readBoulderState(directory)
  return state ? resolveBoulderPlanPath(directory, state) : null
}

function formatStringArray(values: string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`
}

function buildDispatchPrompt(task: PlanGraphTask): string {
  const category = task.category ?? "unspecified-high"
  const skills = formatStringArray(task.skills)
  const references = task.references.length > 0 ? `\nReferences: ${task.references.join(", ")}` : ""
  const qaEvidence = task.qaEvidencePaths.length > 0
    ? `\nExpected QA evidence: ${task.qaEvidencePaths.join(", ")}`
    : ""
  const summary = task.promptSummary ?? task.title

  return [
    `task(category="${category}", load_skills=${skills}, run_in_background=false, description=${JSON.stringify(task.title)}, prompt=\``,
    `TASK: ${task.id} - ${task.title}`,
    `EXPECTED OUTCOME: ${summary}${references}${qaEvidence}`,
    "MUST DO: complete the task, update the plan checkbox, and report verification evidence.",
    "`)",
  ].join("\n")
}

export function createPlanGraphStatusTool(ctx: PlanGraphStatusContext): ToolDefinition {
  return tool({
    description: "Read the active Boulder plan graph and return progress, ready tasks, blocked tasks, warnings, and dispatch prompts.",
    args: {
      planPath: tool.schema.string().optional().describe("Optional plan path. Defaults to the active Boulder plan."),
    },
    execute: async (args: PlanGraphStatusArgs): Promise<string> => {
      const planPath = resolvePlanPath(ctx.directory, args.planPath)
      if (!planPath) {
        return JSON.stringify({
          plan: null,
          progress: { total: 0, completed: 0, remaining: 0, isComplete: false },
          readyBatch: [],
          blockedTasks: [],
          completedTasks: [],
          warnings: ["No active Boulder plan found."],
          recommendedDispatchPrompts: [],
        })
      }

      const parsed = readPlanGraph(planPath)
      if (!parsed) {
        return JSON.stringify({
          plan: { path: planPath, name: getPlanName(planPath), source: null },
          progress: { total: 0, completed: 0, remaining: 0, isComplete: false },
          readyBatch: [],
          blockedTasks: [],
          completedTasks: [],
          warnings: [`Could not read plan graph from ${planPath}.`],
          recommendedDispatchPrompts: [],
        })
      }

      return JSON.stringify({
        plan: { path: planPath, name: getPlanName(planPath), source: parsed.source },
        progress: parsed.progress,
        readyBatch: parsed.readyBatch,
        blockedTasks: parsed.blockedTasks,
        completedTasks: parsed.completedTasks,
        warnings: parsed.warnings,
        recommendedDispatchPrompts: parsed.readyBatch.map(buildDispatchPrompt),
      })
    },
  })
}
