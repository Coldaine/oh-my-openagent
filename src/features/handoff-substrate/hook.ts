import type { Message, Part } from "@opencode-ai/sdk"

import { extractHandoff } from "./extractor"
import { getHandoff, setHandoff } from "./handoff-store"
import { log } from "../../shared/logger"

type MessageWithParts = {
  info: Message
  parts: Part[]
}

export function createHandoffSubstrateHook() {
  return {
    /**
     * Scan messages for handoff blocks and update the store.
     */
    "experimental.chat.messages.transform": async (
      _input: Record<string, never>,
      output: { messages: MessageWithParts[] }
    ): Promise<void> => {
      // Derive session ID from the messages themselves since input is Record<string, never>
      const sessionID = output.messages.find(m => m.info.sessionID)?.info.sessionID
      if (!sessionID) return

      // Walk backwards to find the most recent handoff
      for (let i = output.messages.length - 1; i >= 0; i--) {
        const msg = output.messages[i]
        if (msg.info.role !== "assistant") continue

        // Collect text from parts
        const fullText = msg.parts
          .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
          .map(p => p.text)
          .join("\n")

        const plan = extractHandoff(fullText)
        if (plan) {
          const current = getHandoff(sessionID)
          if (!current || current.plan !== plan) {
            setHandoff(sessionID, plan)
          }
          break
        }
      }
    },

    /**
     * Inject the active handoff into the system prompt.
     */
    "experimental.chat.system.transform": async (
      input: { sessionID?: string; model?: unknown },
      output: { system: string[] }
    ): Promise<void> => {
      if (!input.sessionID) return
      const state = getHandoff(input.sessionID)
      if (state) {
        log("[handoff-substrate] Injecting hardened handoff into system prompt", { sessionID: input.sessionID })
        output.system.push(`
<hardened_handoff_plan>
# ACTIVE IMPLEMENTATION PLAN (MANDATORY)
The following plan was established in the planning phase. Follow it strictly. 
This is your GROUND TRUTH for the current task sequence.

${state.plan}
</hardened_handoff_plan>
`)
      }
    }
  }
}
