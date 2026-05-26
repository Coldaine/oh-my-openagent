import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "bun:test"

import { createBoulderState, writeBoulderState } from "../../features/boulder-state"
import { createPlanGraphStatusTool } from "./status"

let testDirectory: string | null = null

function createTempDirectory(): string {
  testDirectory = mkdtempSync(join(tmpdir(), "plan-graph-status-"))
  return testDirectory
}

afterEach(() => {
  if (testDirectory) {
    rmSync(testDirectory, { recursive: true, force: true })
    testDirectory = null
  }
})

describe("plan_graph_status", () => {
  test("#given active Boulder work #when tool executes #then it returns graph progress and dispatch prompts", async () => {
    const directory = createTempDirectory()
    const planDirectory = join(directory, ".omo", "plans")
    mkdirSync(planDirectory, { recursive: true })
    const planPath = join(planDirectory, "graph.md")
    writeFileSync(planPath, `# Plan

## TODOs

- [x] 1. Build parser
- [ ] 2. Wire status tool

## Machine-Readable Plan Graph

\`\`\`json
{
  "version": 1,
  "tasks": [
    { "id": "todo:1", "title": "Build parser", "status": "completed", "wave": 1, "category": "quick" },
    {
      "id": "todo:2",
      "title": "Wire status tool",
      "status": "pending",
      "wave": 2,
      "category": "deep",
      "skills": ["test-driven-development"],
      "blockedBy": ["todo:1"],
      "references": ["src/tools/plan-graph/status.ts"],
      "qaEvidencePaths": ["src/tools/plan-graph/status.test.ts"],
      "promptSummary": "Expose active plan graph status."
    }
  ]
}
\`\`\`
`, "utf-8")
    writeBoulderState(directory, createBoulderState(planPath, "ses_status", "atlas"))

    const tool = createPlanGraphStatusTool({ directory })
    const result = JSON.parse(await tool.execute({}))

    expect(result.progress).toEqual({ total: 2, completed: 1, remaining: 1, isComplete: false })
    expect(result.readyBatch.map((task: { id: string }) => task.id)).toEqual(["todo:2"])
    expect(result.completedTasks.map((task: { id: string }) => task.id)).toEqual(["todo:1"])
    expect(result.recommendedDispatchPrompts[0]).toContain('category="deep"')
    expect(result.recommendedDispatchPrompts[0]).toContain("run_in_background=false")
    expect(result.recommendedDispatchPrompts[0]).toContain("Expose active plan graph status.")
  })

  test("#given no Boulder state #when no plan path is provided #then it returns a warning instead of throwing", async () => {
    const directory = createTempDirectory()
    const tool = createPlanGraphStatusTool({ directory })

    const result = JSON.parse(await tool.execute({}))

    expect(result.plan).toBeNull()
    expect(result.warnings).toEqual(["No active Boulder plan found."])
  })
})
