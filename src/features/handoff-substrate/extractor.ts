const HANDOFF_START = "[IMPLEMENTATION_HANDOFF]"
const HANDOFF_END = "[/IMPLEMENTATION_HANDOFF]"

export function extractHandoff(text: string): string | undefined {
  const startIndex = text.indexOf(HANDOFF_START)
  if (startIndex === -1) return undefined

  const contentStart = startIndex + HANDOFF_START.length
  const endIndex = text.indexOf(HANDOFF_END, contentStart)

  if (endIndex === -1) {
    return undefined
  }

  return text.substring(contentStart, endIndex).trim()
}
