import { describe, expect, test } from "bun:test"

import { parsePlanGraph, sortPlanGraphTasksTopologically } from "./plan-graph"

const graphPlan = `# Plan

## TODOs

- [x] 1. Build parser
- [ ] 2. Wire status tool
- [ ] 3. Seed team tasks

## Machine-Readable Plan Graph

\`\`\`json
{
  "version": 1,
  "tasks": [
    {
      "id": "todo:1",
      "title": "Build parser",
      "status": "completed",
      "wave": 1,
      "category": "quick",
      "skills": ["test-driven-development"],
      "blockedBy": [],
      "references": ["packages/boulder-state/src"],
      "qaEvidencePaths": ["packages/boulder-state/src/plan-graph.test.ts"],
      "promptSummary": "Implement the graph parser."
    },
    {
      "id": "todo:2",
      "title": "Wire status tool",
      "status": "pending",
      "wave": 2,
      "category": "quick",
      "blockedBy": ["todo:1"],
      "promptSummary": "Expose graph status to Atlas."
    },
    {
      "id": "todo:3",
      "title": "Seed team tasks",
      "status": "pending",
      "wave": 2,
      "category": "deep",
      "blockedBy": ["todo:1"],
      "promptSummary": "Create Team Mode tasks from the graph."
    },
    {
      "id": "final-wave:F1",
      "title": "Oracle review",
      "status": "pending",
      "wave": 3,
      "category": "oracle",
      "blockedBy": ["todo:2", "todo:3"],
      "promptSummary": "Review the finished work."
    }
  ]
}
\`\`\`

## Final Verification Wave

- [ ] F1. Oracle review
`

describe("parsePlanGraph", () => {
  test("#given an embedded graph #when parsed #then it preserves rich task metadata", () => {
    const result = parsePlanGraph(graphPlan, { planPath: ".omo/plans/graph.md" })

    expect(result.source).toBe("embedded")
    expect(result.graph.tasks).toHaveLength(4)
    expect(result.graph.tasks[0]).toMatchObject({
      id: "todo:1",
      title: "Build parser",
      status: "completed",
      wave: 1,
      category: "quick",
      skills: ["test-driven-development"],
      references: ["packages/boulder-state/src"],
      qaEvidencePaths: ["packages/boulder-state/src/plan-graph.test.ts"],
      promptSummary: "Implement the graph parser.",
    })
  })

  test("#given no embedded graph #when parsed #then it falls back to top-level Markdown checklist order", () => {
    const result = parsePlanGraph(`# Plan

## TODOs

- [x] 1. First task
  - [ ] nested checkbox
- [ ] 2. Second task

## Final Verification Wave

- [ ] F1. Final review
`, { planPath: ".omo/plans/fallback.md" })

    expect(result.source).toBe("markdown")
    expect(result.graph.tasks.map((task) => [task.id, task.title, task.status, task.wave])).toEqual([
      ["todo:1", "First task", "completed", 1],
      ["todo:2", "Second task", "pending", 2],
      ["final-wave:F1", "Final review", "pending", 3],
    ])
    expect(result.warnings).toEqual([])
  })

  test("#given graph tasks disagree with checkboxes #when parsed #then warnings identify the mismatch", () => {
    const result = parsePlanGraph(`# Plan

## TODOs

- [ ] 1. First task
- [ ] 2. Second task

## Machine-Readable Plan Graph

\`\`\`json
{ "version": 1, "tasks": [{ "id": "todo:1", "title": "Wrong title", "status": "pending", "wave": 1 }] }
\`\`\`
`, { planPath: ".omo/plans/mismatch.md" })

    expect(result.source).toBe("markdown")
    expect(result.readyBatch.map((task) => task.id)).toEqual(["todo:1"])
    expect(result.warnings).toContain("Graph is missing Markdown task todo:2.")
    expect(result.warnings).toContain('Graph task todo:1 title "Wrong title" does not match Markdown title "First task".')
  })

  test("#given dependency graph #when scheduling #then ready batch contains lowest unfinished unblocked wave", () => {
    const result = parsePlanGraph(graphPlan, { planPath: ".omo/plans/graph.md" })

    expect(result.readyBatch.map((task) => task.id)).toEqual(["todo:2", "todo:3"])
    expect(result.blockedTasks).toEqual([
      {
        id: "final-wave:F1",
        reason: "waiting-for-dependencies",
        blockedBy: ["todo:2", "todo:3"],
      },
    ])
  })

  test("#given incomplete implementation tasks #when final wave is present #then final tasks stay blocked", () => {
    const result = parsePlanGraph(`# Plan

## TODOs

- [ ] 1. Build feature

## Final Verification Wave

- [ ] F1. Oracle review
`, { planPath: ".omo/plans/final.md" })

    expect(result.readyBatch.map((task) => task.id)).toEqual(["todo:1"])
    expect(result.blockedTasks).toEqual([
      {
        id: "final-wave:F1",
        reason: "final-wave-waits-for-implementation",
        blockedBy: ["todo:1"],
      },
    ])
  })

  test("#given malformed graph JSON #when parsed #then Markdown fallback remains usable and warning is emitted", () => {
    const result = parsePlanGraph(`# Plan

## TODOs

- [ ] 1. Recover from malformed graph

## Machine-Readable Plan Graph

\`\`\`json
{ "version": 1, "tasks": [
\`\`\`
`, { planPath: ".omo/plans/malformed.md" })

    expect(result.source).toBe("markdown")
    expect(result.graph.tasks.map((task) => task.id)).toEqual(["todo:1"])
    expect(result.warnings[0]).toStartWith("Could not parse Machine-Readable Plan Graph JSON:")
  })

  test("#given same-wave dependency appears later in the file #when sorted #then blocker comes first", () => {
    const result = parsePlanGraph(`# Plan

## TODOs

- [ ] 1. Consumer
- [ ] 2. Foundation

## Machine-Readable Plan Graph

\`\`\`json
{
  "version": 1,
  "tasks": [
    { "id": "todo:1", "title": "Consumer", "status": "pending", "wave": 1, "blockedBy": ["todo:2"] },
    { "id": "todo:2", "title": "Foundation", "status": "pending", "wave": 1 }
  ]
}
\`\`\`
`, { planPath: ".omo/plans/topological.md" })

    expect(sortPlanGraphTasksTopologically(result.graph).map((task) => task.id)).toEqual(["todo:2", "todo:1"])
  })
})
