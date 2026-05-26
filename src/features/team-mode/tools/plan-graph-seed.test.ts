import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, mock, test } from "bun:test"

import { createBoulderState, writeBoulderState } from "../../boulder-state"
import type { RuntimeState, Task } from "../types"
import { createPlanGraphSeedTeamTasksTool } from "./plan-graph-seed"

let testDirectory: string | null = null

function createTempDirectory(): string {
  testDirectory = mkdtempSync(join(tmpdir(), "plan-graph-seed-"))
  return testDirectory
}

afterEach(() => {
  if (testDirectory) {
    rmSync(testDirectory, { recursive: true, force: true })
    testDirectory = null
  }
})

function createRuntimeState(): RuntimeState {
  return {
    version: 1,
    teamRunId: "00000000-0000-4000-8000-000000000001",
    teamName: "graph-team",
    specSource: "project",
    createdAt: Date.now(),
    status: "active",
    members: [
      { name: "lead", agentType: "leader", status: "running", pendingInjectedMessageIds: [] },
      { name: "quick-worker", agentType: "general-purpose", status: "idle", category: "quick", pendingInjectedMessageIds: [] },
      { name: "deep-worker", agentType: "general-purpose", status: "idle", category: "deep", pendingInjectedMessageIds: [] },
    ],
    shutdownRequests: [],
    bounds: {
      maxMembers: 8,
      maxParallelMembers: 4,
      maxMessagesPerRun: 10000,
      maxWallClockMinutes: 120,
      maxMemberTurns: 500,
    },
  }
}

describe("plan_graph_seed_team_tasks", () => {
  test("#given an active plan graph #when seeding #then team tasks keep graph dependency metadata", async () => {
    const directory = createTempDirectory()
    const planDirectory = join(directory, ".omo", "plans")
    mkdirSync(planDirectory, { recursive: true })
    const planPath = join(planDirectory, "graph.md")
    writeFileSync(planPath, `# Plan

## TODOs

- [ ] 1. Build parser
- [ ] 2. Wire status tool

## Machine-Readable Plan Graph

\`\`\`json
{
  "version": 1,
  "tasks": [
    { "id": "todo:1", "title": "Build parser", "status": "pending", "wave": 1, "category": "quick", "promptSummary": "Implement parser." },
    { "id": "todo:2", "title": "Wire status tool", "status": "pending", "wave": 2, "category": "deep", "blockedBy": ["todo:1"], "references": ["src/tools/plan-graph/status.ts"] },
    { "id": "final-wave:F1", "title": "Oracle review", "status": "pending", "wave": 3, "category": "oracle" }
  ]
}
\`\`\`

## Final Verification Wave

- [ ] F1. Oracle review
`, "utf-8")
    writeBoulderState(directory, createBoulderState(planPath, "ses_seed", "atlas"))

    const createdInputs: Array<Omit<Task, "id" | "createdAt" | "updatedAt" | "version">> = []
    const createTask = mock(async (_teamRunId: string, input: Omit<Task, "id" | "createdAt" | "updatedAt" | "version">): Promise<Task> => {
      createdInputs.push(input)
      const id = String(createdInputs.length)
      return {
        ...input,
        version: 1,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    })
    const tool = createPlanGraphSeedTeamTasksTool(
      { enabled: true },
      { directory },
      {
        loadRuntimeState: mock(async () => createRuntimeState()),
        listTasks: mock(async () => []),
        createTask,
      },
    )

    const result = JSON.parse(await tool.execute({ teamRunId: "00000000-0000-4000-8000-000000000001" }))

    expect(createTask).toHaveBeenCalledTimes(2)
    expect(createdInputs[0]).toMatchObject({
      subject: "Build parser",
      owner: "quick-worker",
      blockedBy: [],
      metadata: {
        planGraph: {
          graphTaskId: "todo:1",
          wave: 1,
          category: "quick",
          promptSummary: "Implement parser.",
        },
      },
    })
    expect(createdInputs[1]).toMatchObject({
      subject: "Wire status tool",
      owner: "deep-worker",
      blockedBy: ["1"],
      metadata: {
        planGraph: {
          graphTaskId: "todo:2",
          blockedByGraphIds: ["todo:1"],
          references: ["src/tools/plan-graph/status.ts"],
        },
      },
    })
    expect(result.graphToTeamTaskId).toEqual({ "todo:1": "1", "todo:2": "2" })
    expect(result.skipped).toEqual([{ graphTaskId: "final-wave:F1", reason: "final-wave-delegated-via-task" }])
  })

  test("#given already-seeded graph tasks #when seeding again #then it reuses existing task ids instead of duplicating work", async () => {
    const directory = createTempDirectory()
    const planDirectory = join(directory, ".omo", "plans")
    mkdirSync(planDirectory, { recursive: true })
    const planPath = join(planDirectory, "graph.md")
    writeFileSync(planPath, `# Plan

## TODOs

- [ ] 1. Build parser
- [ ] 2. Wire status tool

## Machine-Readable Plan Graph

\`\`\`json
{
  "version": 1,
  "tasks": [
    { "id": "todo:1", "title": "Build parser", "status": "pending", "wave": 1, "category": "quick" },
    { "id": "todo:2", "title": "Wire status tool", "status": "pending", "wave": 2, "category": "deep", "blockedBy": ["todo:1"] }
  ]
}
\`\`\`
`, "utf-8")
    writeBoulderState(directory, createBoulderState(planPath, "ses_seed", "atlas"))

    const createTask = mock(async (): Promise<Task> => {
      throw new Error("createTask should not be called when graph tasks are already seeded")
    })
    const tool = createPlanGraphSeedTeamTasksTool(
      { enabled: true },
      { directory },
      {
        loadRuntimeState: mock(async () => createRuntimeState()),
        listTasks: mock(async () => [
          {
            version: 1,
            id: "17",
            subject: "Build parser",
            description: "seeded",
            status: "pending",
            owner: "quick-worker",
            blocks: [],
            blockedBy: [],
            metadata: { planGraph: { graphTaskId: "todo:1" } },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            version: 1,
            id: "18",
            subject: "Wire status tool",
            description: "seeded",
            status: "pending",
            owner: "deep-worker",
            blocks: [],
            blockedBy: ["17"],
            metadata: { planGraph: { graphTaskId: "todo:2" } },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]),
        createTask,
      },
    )

    const result = JSON.parse(await tool.execute({ teamRunId: "00000000-0000-4000-8000-000000000001" }))

    expect(createTask).not.toHaveBeenCalled()
    expect(result.graphToTeamTaskId).toEqual({ "todo:1": "17", "todo:2": "18" })
    expect(result.created).toEqual([])
    expect(result.skipped).toEqual([
      { graphTaskId: "todo:1", reason: "already-seeded" },
      { graphTaskId: "todo:2", reason: "already-seeded" },
    ])
  })
})
