/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { appendModelSelectionEvent, createModelSelectionEvent } from "./model-selection-events"
import { generateModelSelectionReport } from "./model-selection-report"
import { createTemporaryModelSelectionEventsFile } from "./model-selection-test-support"

function createEventsFile(): string {
  return createTemporaryModelSelectionEventsFile("omo-model-selection-report-")
}

describe("generateModelSelectionReport", () => {
  test("returns an empty report message when no model selection events exist", () => {
    const report = generateModelSelectionReport(createEventsFile())

    expect(report).toBe("# Model Selection Report\n\nNo model selection events found.")
  })

  test("summarizes model distribution, fallback frequency, and reason categories", () => {
    const filePath = createEventsFile()
    const configuredPool = ["openai/gpt-5.5", "anthropic/claude-opus-4-7"]

    for (const [timestamp, selectedModel] of [
      ["2026-05-20T00:00:00.000Z", "openai/gpt-5.5"],
      ["2026-05-20T00:01:00.000Z", "anthropic/claude-opus-4-7"],
    ] as const) {
      appendModelSelectionEvent(createModelSelectionEvent({
        timestamp,
        dispatchKind: "category",
        category: "deep",
        candidatePool: configuredPool,
        selectedModel,
        selectionReason: "round-robin selected configured category model pool entry",
      }), filePath)
    }

    appendModelSelectionEvent(createModelSelectionEvent({
      timestamp: "2026-05-20T00:02:00.000Z",
      sessionID: "ses_123",
      dispatchKind: "category",
      category: "deep",
      candidatePool: ["anthropic/claude-sonnet-4-6"],
      selectedModel: "anthropic/claude-sonnet-4-6",
      fallbackInvoked: true,
      fallbackModel: "anthropic/claude-sonnet-4-6",
      selectionReason: "runtime fallback selected by session.error",
    }), filePath)

    const report = generateModelSelectionReport(filePath)

    expect(report).toContain("# Model Selection Report")
    expect(report).toContain("Events: 3")
    expect(report).toContain("Fallbacks: 1 (33.3%)")
    expect(report).toContain("## Selected Model Distribution")
    expect(report).toContain("| Model                       | Selections |")
    expect(report).toContain("| anthropic/claude-opus-4-7   | 1          |")
    expect(report).toContain("| openai/gpt-5.5              | 1          |")
    expect(report).toContain("## Fallback Frequency")
    expect(report).toContain("| yes              | 1      |")
    expect(report).toContain("| no               | 2      |")
    expect(report).toContain("## Reason Categories")
    expect(report).toContain("| fallback    | 1      |")
    expect(report).toContain("| round_robin | 2      |")
  })
})
