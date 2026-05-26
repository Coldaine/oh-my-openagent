import { resolve } from "node:path"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"

import type { TeamModeConfig } from "../../../config/schema/team-mode"
import {
  getPlanName,
  readBoulderState,
  readPlanGraph,
  resolveBoulderPlanPath,
  sortPlanGraphTasksTopologically,
  type PlanGraphTask,
} from "../../boulder-state"
import { loadRuntimeState } from "../team-state-store"
import { createTask } from "../team-tasklist"
import type { RuntimeState, RuntimeStateMember, Task } from "../types"

type PlanGraphSeedContext = Pick<PluginInput, "directory">

type PlanGraphSeedArgs = {
  teamRunId: string
  planPath?: string
}

type PlanGraphSeedDeps = {
  loadRuntimeState: typeof loadRuntimeState
  createTask: typeof createTask
}

const defaultDeps: PlanGraphSeedDeps = {
  loadRuntimeState,
  createTask,
}

function resolvePlanPath(directory: string, planPath: string | undefined): string | null {
  if (planPath?.trim()) {
    return resolve(directory, planPath)
  }

  const state = readBoulderState(directory)
  return state ? resolveBoulderPlanPath(directory, state) : null
}

function findOwnerForTask(task: PlanGraphTask, runtimeState: RuntimeState): string | undefined {
  if (!task.category) return undefined
  const categoryMember = runtimeState.members.find((member) => member.category === task.category)
  return categoryMember?.name
}

function findLead(runtimeState: RuntimeState): RuntimeStateMember | undefined {
  return runtimeState.members.find((member) => member.agentType === "leader")
}

function buildDescription(task: PlanGraphTask): string {
  const lines = [`Graph task ${task.id}: ${task.promptSummary ?? task.title}`]
  if (task.references.length > 0) lines.push(`References: ${task.references.join(", ")}`)
  if (task.qaEvidencePaths.length > 0) lines.push(`QA evidence: ${task.qaEvidencePaths.join(", ")}`)
  if (task.skills.length > 0) lines.push(`Skills: ${task.skills.join(", ")}`)
  return lines.join("\n")
}

function buildMetadata(planPath: string, task: PlanGraphTask): Record<string, unknown> {
  return {
    planGraph: {
      planPath,
      graphTaskId: task.id,
      wave: task.wave,
      category: task.category,
      skills: task.skills,
      blockedByGraphIds: task.blockedBy,
      blocksGraphIds: task.blocks,
      references: task.references,
      qaEvidencePaths: task.qaEvidencePaths,
      promptSummary: task.promptSummary,
    },
  }
}

export function createPlanGraphSeedTeamTasksTool(
  config: TeamModeConfig,
  ctx: PlanGraphSeedContext,
  deps: PlanGraphSeedDeps = defaultDeps,
): ToolDefinition {
  return tool({
    description: "Seed Team Mode tasks from the active Boulder plan graph. Final-wave reviewer tasks are left for task() delegation.",
    args: {
      teamRunId: tool.schema.string().describe("Team run ID"),
      planPath: tool.schema.string().optional().describe("Optional plan path. Defaults to the active Boulder plan."),
    },
    execute: async (args: PlanGraphSeedArgs): Promise<string> => {
      if (!config.enabled) {
        throw new Error("plan_graph_seed_team_tasks requires team_mode.enabled=true")
      }

      const planPath = resolvePlanPath(ctx.directory, args.planPath)
      if (!planPath) {
        return JSON.stringify({
          plan: null,
          created: [],
          skipped: [],
          graphToTeamTaskId: {},
          warnings: ["No active Boulder plan found."],
        })
      }

      const parsed = readPlanGraph(planPath)
      if (!parsed) {
        return JSON.stringify({
          plan: { path: planPath, name: getPlanName(planPath), source: null },
          created: [],
          skipped: [],
          graphToTeamTaskId: {},
          warnings: [`Could not read plan graph from ${planPath}.`],
        })
      }

      const runtimeState = await deps.loadRuntimeState(args.teamRunId, config)
      const leadName = findLead(runtimeState)?.name
      const graphToTeamTaskId: Record<string, string> = {}
      const created: Array<{ graphTaskId: string; teamTaskId: string; owner?: string }> = []
      const skipped: Array<{ graphTaskId: string; reason: string }> = []
      const warnings = [...parsed.warnings]

      for (const graphTask of sortPlanGraphTasksTopologically(parsed.graph)) {
        if (graphTask.status === "completed") {
          skipped.push({ graphTaskId: graphTask.id, reason: "already-completed" })
          continue
        }
        if (graphTask.section === "final-wave") {
          skipped.push({ graphTaskId: graphTask.id, reason: "final-wave-delegated-via-task" })
          continue
        }

        const missingMappedBlockers = graphTask.blockedBy.filter((graphTaskId) => !graphToTeamTaskId[graphTaskId])
        if (missingMappedBlockers.length > 0) {
          warnings.push(`Task ${graphTask.id} has blockers without seeded team task IDs: ${missingMappedBlockers.join(", ")}.`)
        }

        const owner = findOwnerForTask(graphTask, runtimeState) ?? leadName
        const taskInput: Omit<Task, "id" | "createdAt" | "updatedAt" | "version"> = {
          subject: graphTask.title,
          description: buildDescription(graphTask),
          status: "pending",
          owner,
          blocks: [],
          blockedBy: graphTask.blockedBy
            .map((graphTaskId) => graphToTeamTaskId[graphTaskId])
            .filter((teamTaskId): teamTaskId is string => typeof teamTaskId === "string"),
          metadata: buildMetadata(planPath, graphTask),
        }

        const createdTask = await deps.createTask(args.teamRunId, taskInput, config)
        graphToTeamTaskId[graphTask.id] = createdTask.id
        created.push({ graphTaskId: graphTask.id, teamTaskId: createdTask.id, owner })
      }

      return JSON.stringify({
        plan: { path: planPath, name: getPlanName(planPath), source: parsed.source },
        created,
        skipped,
        graphToTeamTaskId,
        warnings,
      })
    },
  })
}
