import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import type { TripleLearningStorage } from "../../features/triple-learning"
import { MEMORY_TYPES, MEMORY_STATUSES } from "../../features/triple-learning"

export function createTripleLearnSearchTool(storage: TripleLearningStorage): ToolDefinition {
  return tool({
    description:
      "Search across cross-session memories, learned skills, and conventions. Use this to recall past learnings before starting new work.",
    args: {
      query: tool.schema.string().describe("Search query to find matching entries"),
      type: tool.schema.string().optional().describe("Type of memory to search (memory, skill, convention)"),
      limit: tool.schema.number().optional().default(10).describe("Maximum results to return"),
    },
    async execute(rawArgs) {
      const args = rawArgs as { query: string; type?: string; limit?: number }
      const query = args.query
      const type = args.type && MEMORY_TYPES.includes(args.type as (typeof MEMORY_TYPES)[number])
        ? (args.type as (typeof MEMORY_TYPES)[number])
        : undefined
      const limit = args.limit ?? 10
      const types = type ? [type] : [...MEMORY_TYPES]
      const results = types.flatMap((t) => storage.searchEntries(t, query))
      return { output: JSON.stringify(results.slice(0, limit), null, 2) }
    },
  })
}

export function createTripleLearnListTool(storage: TripleLearningStorage): ToolDefinition {
  return tool({
    description:
      "List all cross-session memories, skills, or conventions. Use this to inspect what has been learned.",
    args: {
      type: tool.schema.string().optional().describe("Type of memory to list (memory, skill, convention)"),
      status: tool.schema.string().optional().describe("Filter by status (active, superseded, archived)"),
      limit: tool.schema.number().optional().default(20).describe("Maximum results to return"),
    },
    async execute(rawArgs) {
      const args = rawArgs as { type?: string; status?: string; limit?: number }
      const type = args.type && MEMORY_TYPES.includes(args.type as (typeof MEMORY_TYPES)[number])
        ? (args.type as (typeof MEMORY_TYPES)[number])
        : undefined
      const status = args.status && MEMORY_STATUSES.includes(args.status as (typeof MEMORY_STATUSES)[number])
        ? (args.status as (typeof MEMORY_STATUSES)[number])
        : undefined
      const limit = args.limit ?? 20
      const types = type ? [type] : [...MEMORY_TYPES]
      const results = types.flatMap((t) => storage.listEntries(t, status))
      return { output: JSON.stringify(results.slice(0, limit), null, 2) }
    },
  })
}

export function createTripleLearnStatsTool(storage: TripleLearningStorage): ToolDefinition {
  return tool({
    description:
      "Get statistics about the triple learning system: total memories, skills, conventions, and recent entries.",
    args: {},
    async execute() {
      const stats = storage.getStats()
      return { output: JSON.stringify(stats, null, 2) }
    },
  })
}

export function createTripleLearnForgetTool(storage: TripleLearningStorage): ToolDefinition {
  return tool({
    description:
      "Archive a specific memory, skill, or convention entry by type and ID. Use this to remove outdated or incorrect learnings.",
    args: {
      type: tool.schema.string().describe("Type of the entry (memory, skill, convention)"),
      id: tool.schema.string().describe("Entry ID to archive"),
    },
    async execute(rawArgs) {
      const args = rawArgs as { type: string; id: string }
      if (!MEMORY_TYPES.includes(args.type as (typeof MEMORY_TYPES)[number])) {
        return { output: `Error: Invalid type: ${args.type}. Must be one of: ${MEMORY_TYPES.join(", ")}` }
      }
      const result = storage.deleteEntry(args.type as (typeof MEMORY_TYPES)[number], args.id)
      if (!result) {
        return { output: `Error: Entry not found: ${args.type}/${args.id}` }
      }
      return { output: `Archived ${args.type}/${args.id}` }
    },
  })
}
