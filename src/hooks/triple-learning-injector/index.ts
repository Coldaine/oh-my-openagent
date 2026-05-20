import { log } from "../../shared/logger"
import type { TripleLearningStorage } from "../../features/triple-learning"

export function createTripleLearningInjectorHook(deps: {
  storage: TripleLearningStorage
}) {
  const { storage } = deps

  return {
    "experimental.chat.messages.transform": async (
      _input: Record<string, never>,
      output: { messages: Array<Record<string, unknown>> }
    ) => {
      const config = storage.getConfig()
      if (!config.enabled) return

      const context = storage.getRecentContext()
      if (!context) return

      if (!output.messages || output.messages.length === 0) return

      const injectBlock = `<triple_learning_context>\n${context}\n</triple_learning_context>`

      const firstMessage = output.messages[0]
      if (typeof firstMessage?.info === "object" && firstMessage.info !== null) {
        const info = firstMessage.info as Record<string, unknown>
        if (info.role === "user") {
          const existingContent = typeof info.content === "string" ? info.content : ""
          output.messages[0] = {
            ...firstMessage,
            info: { ...info, content: `${injectBlock}\n\n${existingContent}` },
          }
          log("[triple-learning-injector] Injected cross-session context into first user message")
        }
      }
    },
  }
}
