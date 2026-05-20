export const MEMORY_TYPES = ["memory", "skill", "convention"] as const
export type MemoryType = (typeof MEMORY_TYPES)[number]

export const MEMORY_STATUSES = ["active", "superseded", "archived"] as const
export type MemoryStatus = (typeof MEMORY_STATUSES)[number]

export const MEMORY_CONFIDENCES = ["low", "medium", "high"] as const
export type MemoryConfidence = (typeof MEMORY_CONFIDENCES)[number]

export const MEMORY_CATEGORIES = [
  "fact",
  "preference",
  "procedure",
  "pattern",
  "decision",
  "tool_discovery",
  "observation",
] as const
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number]

export const EXTRACTION_TRIGGERS = ["tool_execution", "session_complete", "manual"] as const
export type ExtractionTrigger = (typeof EXTRACTION_TRIGGERS)[number]

export interface MemoryEntry {
  id: string
  type: MemoryType
  content: string
  category: MemoryCategory
  confidence: MemoryConfidence
  status: MemoryStatus
  tags: string[]
  source: string
  session_id?: string
  trigger: ExtractionTrigger
  superseded_by?: string
  created_at: string
  updated_at: string
}

export interface TripleLearningConfig {
  enabled: boolean
  auto_extract_memories: boolean
  auto_extract_skills: boolean
  auto_confirm_skills_threshold: MemoryConfidence
  conventions_require_confirmation: boolean
  max_memories_per_session: number
  max_skills_per_session: number
  memory_context_limit: number
  base_dir: string | null
}

export interface ExtractionResult {
  entries: Array<{
    type: MemoryType
    content: string
    category: MemoryCategory
    confidence: MemoryConfidence
    tags: string[]
    source: string
  }>
}

export interface TripleLearnStats {
  total_memories: number
  total_skills: number
  total_conventions: number
  active_memories: number
  active_skills: number
  active_conventions: number
  recent_entries: MemoryEntry[]
}
