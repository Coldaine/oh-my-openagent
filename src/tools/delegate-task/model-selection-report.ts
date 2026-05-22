import { existsSync, readFileSync } from "fs"
import type { ModelSelectionEvent } from "./model-selection-events"

interface CountRow {
  label: string
  count: number
}

function parseEvents(eventsFilePath: string): ModelSelectionEvent[] {
  if (!existsSync(eventsFilePath)) return []

  return readFileSync(eventsFilePath, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      try {
        return JSON.parse(line) as ModelSelectionEvent
      } catch {
        return null
      }
    })
    .filter((event): event is ModelSelectionEvent => event !== null)
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1)
}

function sortedRows(counts: Map<string, number>): CountRow[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function formatTable(headers: string[], rows: string[][]): string[] {
  if (rows.length === 0) {
    return ["No data."]
  }

  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => row[index].length)))
  const formatRow = (cells: string[]): string => `| ${cells.map((cell, index) => cell.padEnd(widths[index])).join(" | ")} |`
  const separator = `|${widths.map((width) => "-".repeat(width + 2)).join("|")}|`

  return [formatRow(headers), separator, ...rows.map(formatRow)]
}

function reasonCategory(event: ModelSelectionEvent): string {
  if (event.fallbackInvoked) return "fallback"
  if (/round.?robin/i.test(event.selectionReason)) return "round_robin"
  if (/unavailable|skip/i.test(event.selectionReason)) return "availability"
  if (/user|override|configured/i.test(event.selectionReason)) return "configured"
  if (/default|system/i.test(event.selectionReason)) return "default"
  return "round_robin"
}

export function generateModelSelectionReport(eventsFilePath: string): string {
  const events = parseEvents(eventsFilePath)
  if (events.length === 0) {
    return "# Model Selection Report\n\nNo model selection events found."
  }

  const selectedModelCounts = new Map<string, number>()
  const reasonCounts = new Map<string, number>()
  let fallbackCount = 0

  for (const event of events) {
    increment(selectedModelCounts, event.selectedModel)
    increment(reasonCounts, reasonCategory(event))
    if (event.fallbackInvoked) fallbackCount++
  }

  const fallbackPercent = ((fallbackCount / events.length) * 100).toFixed(1)
  const lines = [
    "# Model Selection Report",
    "",
    `Events: ${events.length}`,
    `Fallbacks: ${fallbackCount} (${fallbackPercent}%)`,
    "",
    "## Selected Model Distribution",
    "",
    ...formatTable(
      ["Model", "Selections"],
      sortedRows(selectedModelCounts).map((row) => [row.label, row.count.toString()]),
    ),
    "",
    "## Fallback Frequency",
    "",
    ...formatTable(
      ["Fallback Invoked", "Events"],
      [
        ["yes", fallbackCount.toString()],
        ["no", (events.length - fallbackCount).toString()],
      ],
    ),
    "",
    "## Reason Categories",
    "",
    ...formatTable(
      ["Reason", "Events"],
      sortedRows(reasonCounts).map((row) => [row.label, row.count.toString()]),
    ),
  ]

  return lines.join("\n")
}
