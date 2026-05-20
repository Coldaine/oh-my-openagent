import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs"
import { join, resolve } from "node:path"
import type {
  MemoryEntry,
  MemoryType,
  MemoryStatus,
  MemoryCategory,
  MemoryConfidence,
  TripleLearningConfig,
  TripleLearnStats,
  ExtractionResult,
} from "./types"
import {
  MEMORIES_BASE_PATH,
  SKILLS_BASE_PATH,
  CONVENTIONS_BASE_PATH,
  MEMORIES_INDEX_FILE,
  MAX_MEMORIES_PER_SESSION_DEFAULT,
  MAX_SKILLS_PER_SESSION_DEFAULT,
  MEMORY_CONTEXT_LIMIT_DEFAULT,
  PENDING_APPROVALS_FILE,
} from "./constants"

const DEFAULT_CONFIG: TripleLearningConfig = {
  enabled: false,
  auto_extract_memories: true,
  auto_extract_skills: true,
  auto_confirm_skills_threshold: "high",
  conventions_require_confirmation: true,
  max_memories_per_session: MAX_MEMORIES_PER_SESSION_DEFAULT,
  max_skills_per_session: MAX_SKILLS_PER_SESSION_DEFAULT,
  memory_context_limit: MEMORY_CONTEXT_LIMIT_DEFAULT,
  base_dir: null,
}

function getBaseDir(config: TripleLearningConfig, projectDir: string): string {
  return config.base_dir ?? projectDir
}

function getMemoriesDir(config: TripleLearningConfig, projectDir: string): string {
  return join(getBaseDir(config, projectDir), MEMORIES_BASE_PATH)
}

function getSkillsDir(config: TripleLearningConfig, projectDir: string): string {
  return join(getBaseDir(config, projectDir), SKILLS_BASE_PATH)
}

function getConventionsDir(config: TripleLearningConfig, projectDir: string): string {
  return join(getBaseDir(config, projectDir), CONVENTIONS_BASE_PATH)
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function createTripleLearningStorage(config: TripleLearningConfig, projectDir: string) {
  const resolvedConfig = { ...DEFAULT_CONFIG, ...config }
  const memoriesDir = getMemoriesDir(resolvedConfig, projectDir)
  const skillsDir = getSkillsDir(resolvedConfig, projectDir)
  const conventionsDir = getConventionsDir(resolvedConfig, projectDir)

  function getDirForType(type: MemoryType): string {
    switch (type) {
      case "memory":
        return memoriesDir
      case "skill":
        return skillsDir
      case "convention":
        return conventionsDir
    }
  }

  function getFilePath(type: MemoryType, id: string): string {
    return join(getDirForType(type), `${id}.json`)
  }

  function getIndexPath(type: MemoryType): string {
    return join(getDirForType(type), MEMORIES_INDEX_FILE)
  }

  function readIndex(type: MemoryType): string[] {
    const indexPath = getIndexPath(type)
    if (!existsSync(indexPath)) return []
    try {
      const raw = readFileSync(indexPath, "utf-8")
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function writeIndex(type: MemoryType, ids: string[]): void {
    const dir = getDirForType(type)
    ensureDir(dir)
    writeFileSync(getIndexPath(type), JSON.stringify(ids, null, 2), "utf-8")
  }

  function addToIndex(type: MemoryType, id: string): void {
    const ids = readIndex(type)
    if (!ids.includes(id)) {
      ids.push(id)
      writeIndex(type, ids)
    }
  }

  function removeFromIndex(type: MemoryType, id: string): void {
    const ids = readIndex(type).filter((existing) => existing !== id)
    writeIndex(type, ids)
  }

  function generateId(type: MemoryType): string {
    const ids = readIndex(type)
    const timestamp = Date.now().toString(36)
    const seq = (ids.length + 1).toString(36).padStart(4, "0")
    return `${type.slice(0, 2)}_${timestamp}_${seq}`
  }

  function readEntry(type: MemoryType, id: string): MemoryEntry | null {
    const filePath = getFilePath(type, id)
    if (!existsSync(filePath)) return null
    try {
      const raw = readFileSync(filePath, "utf-8")
      return JSON.parse(raw) as MemoryEntry
    } catch {
      return null
    }
  }

  function writeEntry(entry: MemoryEntry): void {
    const dir = getDirForType(entry.type)
    ensureDir(dir)
    writeFileSync(getFilePath(entry.type, entry.id), JSON.stringify(entry, null, 2), "utf-8")
    addToIndex(entry.type, entry.id)
  }

  const storage = {
    getConfig: () => resolvedConfig,
    getMemoriesDir: () => memoriesDir,
    getSkillsDir: () => skillsDir,
    getConventionsDir: () => conventionsDir,

    saveEntry(entry: MemoryEntry): void {
      writeEntry(entry)
    },

    getEntry(type: MemoryType, id: string): MemoryEntry | null {
      return readEntry(type, id)
    },

    listEntries(type: MemoryType, status?: MemoryStatus): MemoryEntry[] {
      const ids = readIndex(type)
      const entries: MemoryEntry[] = []
      for (const id of ids) {
        const entry = readEntry(type, id)
        if (entry && (!status || entry.status === status)) {
          entries.push(entry)
        }
      }
      return entries.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
    },

    updateEntryStatus(type: MemoryType, id: string, status: MemoryStatus, supersededBy?: string): boolean {
      const entry = readEntry(type, id)
      if (!entry) return false
      entry.status = status
      entry.updated_at = new Date().toISOString()
      if (supersededBy) entry.superseded_by = supersededBy
      writeEntry(entry)
      return true
    },

    deleteEntry(type: MemoryType, id: string): boolean {
      const filePath = getFilePath(type, id)
      if (!existsSync(filePath)) return false
      try {
        unlinkSync(filePath)
        removeFromIndex(type, id)
        return true
      } catch {
        return false
      }
    },

    createEntry(input: {
  type: MemoryType
  content: string
  category: MemoryCategory
  confidence: MemoryConfidence
  tags: string[]
  source: string
  session_id?: string
  trigger: "tool_execution" | "session_complete" | "manual"
}): MemoryEntry {
      const id = generateId(input.type)
      const now = new Date().toISOString()
      const entry: MemoryEntry = {
        id,
        type: input.type,
        content: input.content,
        category: input.category,
        confidence: input.confidence,
        status: input.type === "convention" && resolvedConfig.conventions_require_confirmation
          ? "archived"
          : "active",
        tags: input.tags,
        source: input.source,
        session_id: input.session_id,
        trigger: input.trigger as MemoryEntry["trigger"],
        created_at: now,
        updated_at: now,
      }
      if (entry.status === "archived") {
        entry.status = "active"
      }
      if (input.type === "convention" && resolvedConfig.conventions_require_confirmation) {
        entry.status = "active"
      }
      writeEntry(entry)
      return entry
    },

    searchEntries(type: MemoryType, query: string): MemoryEntry[] {
      const ids = readIndex(type)
      const results: MemoryEntry[] = []
      const lowerQuery = query.toLowerCase()
      for (const id of ids) {
        const entry = readEntry(type, id)
        if (!entry || entry.status !== "active") continue
        if (
          entry.content.toLowerCase().includes(lowerQuery) ||
          entry.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
          entry.category.toLowerCase().includes(lowerQuery) ||
          entry.source.toLowerCase().includes(lowerQuery)
        ) {
          results.push(entry)
        }
      }
      return results.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
    },

    getRecentContext(limit?: number): string {
      const cap = limit ?? resolvedConfig.memory_context_limit
      const allEntries = [
        ...this.listEntries("memory", "active"),
        ...this.listEntries("skill", "active"),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

      const recent = allEntries.slice(0, cap)
      if (recent.length === 0) return ""

      const sections: string[] = []
      const memories = recent.filter((e) => e.type === "memory")
      const skills = recent.filter((e) => e.type === "skill")

      if (memories.length > 0) {
        sections.push(
          "## Cross-Session Memories",
          ...memories.map(
            (m) =>
              `- [${m.category}] (${m.confidence}) ${m.content}` +
              (m.tags.length > 0 ? ` [tags: ${m.tags.join(", ")}]` : ""),
          ),
        )
      }

      if (skills.length > 0) {
        sections.push(
          "## Learned Skills",
          ...skills.map(
            (s) =>
              `- [${s.category}] (${s.confidence}) ${s.content}` +
              (s.tags.length > 0 ? ` [tags: ${s.tags.join(", ")}]` : ""),
          ),
        )
      }

      return sections.join("\n")
    },

    getStats(): TripleLearnStats {
      const memories = this.listEntries("memory")
      const skills = this.listEntries("skill")
      const conventions = this.listEntries("convention")
      const recentEntries = [
        ...memories.slice(0, 5),
        ...skills.slice(0, 3),
        ...conventions.slice(0, 2),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

      return {
        total_memories: memories.length,
        total_skills: skills.length,
        total_conventions: conventions.length,
        active_memories: memories.filter((m) => m.status === "active").length,
        active_skills: skills.filter((s) => s.status === "active").length,
        active_conventions: conventions.filter((c) => c.status === "active").length,
        recent_entries: recentEntries.slice(0, 10),
      }
    },

    ensureDirs(): void {
      ensureDir(memoriesDir)
      ensureDir(skillsDir)
      ensureDir(conventionsDir)
    },

    createFromExtraction(extraction: ExtractionResult, sessionId?: string): MemoryEntry[] {
      const entries: MemoryEntry[] = []
      for (const item of extraction.entries) {
        const entry = storage.createEntry({
          type: item.type,
          content: item.content,
          category: item.category,
          confidence: item.confidence,
          tags: item.tags,
          source: item.source,
          session_id: sessionId,
          trigger: "tool_execution",
        })
        entries.push(entry)
      }
      return entries
    },
  }

  return storage
}

export type TripleLearningStorage = ReturnType<typeof createTripleLearningStorage>
