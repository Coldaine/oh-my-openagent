import { extractMemories } from "../../features/triple-learning/extraction"
import type { TripleLearningStorage } from "../../features/triple-learning"

export function createTripleLearningExtractorHook(deps: {
  storage: TripleLearningStorage
  projectDir: string
}) {
  const { storage } = deps
  const config = storage.getConfig()
  let memoriesExtractedThisSession = 0
  let skillsExtractedThisSession = 0

  return {
    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { title: string; output: string; metadata: unknown }
    ) => {
      if (!config.enabled) return
      if (!config.auto_extract_memories && !config.auto_extract_skills) return

      if (!output || !output.output) return

      const toolName = input.tool
      const toolOutput = output.output

      const extraction = extractMemories({
        toolName,
        toolInput: "",
        toolOutput,
        wasSuccessful: true,
        source: `tool:${toolName}`,
      })

      if (extraction.entries.length === 0) return

      for (const item of extraction.entries) {
        if (item.type === "skill" && !config.auto_extract_skills) continue
        if (item.type === "memory" && !config.auto_extract_memories) continue

        if (item.type === "memory" && memoriesExtractedThisSession >= config.max_memories_per_session) continue
        if (item.type === "skill" && skillsExtractedThisSession >= config.max_skills_per_session) continue

        if (item.type === "skill" && item.confidence === "low" && config.auto_confirm_skills_threshold !== "low") continue

        storage.createEntry({
          type: item.type,
          content: item.content,
          category: item.category,
          confidence: item.confidence,
          tags: item.tags,
          source: item.source,
          trigger: "tool_execution" as const,
        })

        if (item.type === "memory") memoriesExtractedThisSession++
        if (item.type === "skill") skillsExtractedThisSession++
      }
    },
  }
}
