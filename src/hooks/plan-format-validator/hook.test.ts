import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "bun:test"

import { createPlanFormatValidatorHook } from "./hook"

let testDirectory: string | null = null

function createTempDirectory(): string {
  testDirectory = mkdtempSync(join(tmpdir(), "plan-format-validator-"))
  return testDirectory
}

afterEach(() => {
  if (testDirectory) {
    rmSync(testDirectory, { recursive: true, force: true })
    testDirectory = null
  }
})

describe("createPlanFormatValidatorHook", () => {
  test("#given a graph/checklist mismatch #when plan write completes #then output includes graph warning", async () => {
    const directory = createTempDirectory()
    const planDirectory = join(directory, ".omo", "plans")
    mkdirSync(planDirectory, { recursive: true })
    const planPath = join(planDirectory, "graph-mismatch.md")
    writeFileSync(planPath, `# Plan

## TODOs

- [ ] 1. First task
- [ ] 2. Second task

## Machine-Readable Plan Graph

\`\`\`json
{ "version": 1, "tasks": [{ "id": "todo:1", "title": "Wrong title", "status": "pending", "wave": 1 }] }
\`\`\`
`, "utf-8")

    const hook = createPlanFormatValidatorHook({ directory } as never)
    const output = { title: "write", output: "ok", metadata: undefined }

    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "ses_plan",
        callID: "call_plan",
        args: { filePath: ".omo/plans/graph-mismatch.md" },
      },
      output,
    )

    expect(output.output).toContain("<plan-format-warning>")
    expect(output.output).toContain("Graph is missing Markdown task todo:2.")
    expect(output.output).toContain('Graph task todo:1 title "Wrong title" does not match Markdown title "First task".')
  })
})
