import type { ExtractionResult, MemoryCategory, MemoryConfidence, MemoryType } from "./types"

interface ExtractedMemory {
  content: string
  category: MemoryCategory
  confidence: MemoryConfidence
  tags: string[]
  type: MemoryType
}

const PROCEDURE_PATTERNS = [
  /^(?:to|how|steps?|way|method|process|approach|technique)/i,
  /^(?:use|using|run|execute|implement|create|build|configure)/i,
  /^\d+\.\s+/,
]

const PATTERN_PATTERNS = [
  /^when.*?then/i,
  /^if.*?(?:then|should)/i,
  /^(?:always|never|usually|typically|commonly)/i,
  /^(?:follow|follows|following)\s+(?:the|this|these)/i,
]

const DECISION_PATTERNS = [
  /^(?:we|i)\s+(?:decided|chose|opted|selected|picked)/i,
  /^(?:the\s+)?(?:decision|choice|rationale|reasoning)/i,
  /^(?:after|based on).*?(?:decided|chose)/i,
]

const TOOL_DISCOVERY_PATTERNS = [
  /^(?:found|discovered|learned|realized).*?(?:tool|command|api|endpoint|function)/i,
  /^the\s+(?:`[^`]+`|\w+\s+tool|tool\s+`[^`]+`)/i,
]

const FACT_PATTERNS = [
  /^(?:note|remember|key\s+point|importantly|crucially|it\s+seems|apparently)/i,
  /^(?:the\s+)?(?:project|codebase|repository|system|application)\s+(?:uses|is|has|contains)/i,
]

function classifyCategory(content: string): MemoryCategory {
  if (PROCEDURE_PATTERNS.some((p) => p.test(content))) return "procedure"
  if (PATTERN_PATTERNS.some((p) => p.test(content))) return "pattern"
  if (DECISION_PATTERNS.some((p) => p.test(content))) return "decision"
  if (TOOL_DISCOVERY_PATTERNS.some((p) => p.test(content))) return "tool_discovery"
  if (FACT_PATTERNS.some((p) => p.test(content))) return "fact"
  return "observation"
}

function extractTags(content: string): string[] {
  const tags: string[] = []
  const codeRefs = content.match(/`[^`]+`/g)
  if (codeRefs) {
    tags.push(...codeRefs.map((r) => r.replace(/`/g, "").toLowerCase()))
  }
  const keywords = content.match(/\b(?:bug|fix|feature|api|config|setup|deploy|test|refactor|performance|security|docs)\b/gi)
  if (keywords) {
    tags.push(...keywords.map((k) => k.toLowerCase()))
  }
  return [...new Set(tags)]
}

function estimateConfidence(
  content: string,
  isFromSuccessfulRun: boolean,
  isRepeated: boolean,
): MemoryConfidence {
  if (isRepeated && isFromSuccessfulRun) return "high"
  if (isFromSuccessfulRun && content.length > 80) return "medium"
  if (content.length < 30) return "low"
  return isFromSuccessfulRun ? "medium" : "low"
}

function classifyType(
  content: string,
  category: MemoryCategory,
): MemoryType {
  if (category === "procedure" || category === "tool_discovery") return "skill"
  if (category === "decision" || category === "pattern") return "convention"
  return "memory"
}

export function extractMemories(input: {
  toolName: string
  toolInput: string
  toolOutput: string
  wasSuccessful: boolean
  source: string
}): ExtractionResult {
  const { toolName, toolOutput, wasSuccessful, source } = input
  const entries: ExtractionResult["entries"] = []

  if (!wasSuccessful || !toolOutput || toolOutput.trim().length < 20) {
    return { entries }
  }

  const lines = toolOutput.split("\n").filter((l) => l.trim().length > 0)
  const meaningfulLines = lines.filter(
    (l) => l.trim().length > 30 && !l.trim().startsWith("{") && !l.trim().startsWith("["),
  )

  for (const line of meaningfulLines.slice(0, 5)) {
    const category = classifyCategory(line)
    const tags = extractTags(line)
    const confidence = estimateConfidence(line, wasSuccessful, false)
    const type = classifyType(line, category)

    const extracted: ExtractedMemory = {
      content: line.trim().slice(0, 500),
      category,
      confidence,
      tags,
      type,
    }

    entries.push({
      type: extracted.type,
      content: extracted.content,
      category: extracted.category,
      confidence: extracted.confidence,
      tags: extracted.tags,
      source,
    })
  }

  return { entries }
}

export function extractFromSessionData(input: {
  sessionTitle: string
  messages: Array<{ role: string; content: string }>
  wasSuccessful: boolean
  source: string
}): ExtractionResult {
  const { messages, wasSuccessful, source } = input
  const entries: ExtractionResult["entries"] = []

  if (!wasSuccessful) return { entries }

  const assistantMessages = messages.filter((m) => m.role === "assistant")
  for (const msg of assistantMessages.slice(-3)) {
    const content = msg.content
    if (!content || content.length < 40) continue

    const sentences = content
      .split(/[.!?]\s+/)
      .filter((s) => s.trim().length > 30 && s.trim().length < 500)

    for (const sentence of sentences.slice(0, 3)) {
      const category = classifyCategory(sentence)
      const tags = extractTags(sentence)
      const type = classifyType(sentence, category)
      entries.push({
        type,
        content: sentence.trim(),
        category,
        confidence: "low",
        tags,
        source,
      })
    }
  }

  return { entries }
}
