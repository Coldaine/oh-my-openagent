/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { mkdtempSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  appendModelSelectionEvent,
  createModelSelectionEvent,
  resetModelSelectionEvents
} from "./model-selection-events"

function createEventsFile(): string {
  return join(mkdtempSync(join(tmpdir(), "omo-model-selection-")), "events.jsonl")
}

describe("model-selection-events", () => {
  describe("#given routing metadata for a category model pool", () => {
    describe("#when creating a model selection event", () => {
      test("#then fills timestamp and round-robin strategy without prompt content", () => {
        const input = {
          dispatchKind: "category" as const,
          category: "deep",
          candidatePool: ["openai/gpt-5.5", "anthropic/claude-opus-4-7"],
          selectedModel: "openai/gpt-5.5",
          selectionReason: "round-robin selected configured category model pool entry",
          prompt: "do not capture this user prompt",
        }

        const event = createModelSelectionEvent(input)

        expect(new Date(event.timestamp).toString()).not.toBe("Invalid Date")
        expect(event.strategy).toBe("round_robin")
        expect(event.dispatchKind).toBe("category")
        expect(event.category).toBe("deep")
        expect(event.candidatePool).toEqual(["openai/gpt-5.5", "anthropic/claude-opus-4-7"])
        expect(JSON.stringify(event)).not.toContain("do not capture")
        expect("prompt" in event).toBe(false)
      })
    })
  })

  describe("#given an event file path", () => {
    describe("#when events are appended as JSONL", () => {
      test("#then each event is written on its own line", () => {
        const filePath = createEventsFile()
        const first = createModelSelectionEvent({
          timestamp: "2026-05-20T00:00:00.000Z",
          dispatchKind: "category",
          category: "quick",
          candidatePool: ["openai/gpt-5.4-mini"],
          selectedModel: "openai/gpt-5.4-mini",
          selectionReason: "single configured category model",
        })
        const second = createModelSelectionEvent({
          timestamp: "2026-05-20T00:01:00.000Z",
          dispatchKind: "direct_agent",
          agent: "oracle",
          candidatePool: ["openai/gpt-5.5", "anthropic/claude-opus-4-7"],
          selectedModel: "anthropic/claude-opus-4-7",
          skippedModels: [{ model: "openai/gpt-5.5", reason: "marked unavailable" }],
          selectionReason: "round-robin skipped unavailable direct agent model pool entry",
        })

        appendModelSelectionEvent(first, filePath)
        appendModelSelectionEvent(second, filePath)

        const lines = readFileSync(filePath, "utf-8").trim().split("\n")
        expect(lines).toHaveLength(2)
        expect(JSON.parse(lines[0])).toEqual(first)
        expect(JSON.parse(lines[1])).toEqual(second)
      })
    })
  })

  describe("#given an existing events file", () => {
    describe("#when resetModelSelectionEvents is called", () => {
      test("#then clears the file for isolated tests", () => {
        const filePath = createEventsFile()
        const event = createModelSelectionEvent({
          dispatchKind: "category",
          category: "writing",
          candidatePool: ["kimi-for-coding/k2p5"],
          selectedModel: "kimi-for-coding/k2p5",
          selectionReason: "single category model",
        })
        appendModelSelectionEvent(event, filePath)

        resetModelSelectionEvents(filePath)

        expect(readFileSync(filePath, "utf-8")).toBe("")
      })
    })
  })

  describe("#given an input object with extra sensitive fields", () => {
    describe("#when appending the created event", () => {
      test("#then only routing metadata is persisted", () => {
        const filePath = createEventsFile()
        const inputWithSensitiveFields = {
          dispatchKind: "direct_agent" as const,
          agent: "oracle",
          sessionID: "ses_123",
          candidatePool: ["openai/gpt-5.5"],
          selectedModel: "openai/gpt-5.5",
          selectionReason: "single configured direct agent model",
          prompt: "secret prompt",
          browserUrl: "https://example.com/private",
          toolOutput: "secret tool output",
        }

        const event = createModelSelectionEvent(inputWithSensitiveFields)
        appendModelSelectionEvent(event, filePath)

        const persisted = readFileSync(filePath, "utf-8")
        expect(persisted).not.toContain("secret prompt")
        expect(persisted).not.toContain("https://example.com/private")
        expect(persisted).not.toContain("secret tool output")
        expect(JSON.parse(persisted).sessionID).toBe("ses_123")
      })
    })
  })
})
