import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { join } from "node:path"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { createTripleLearningStorage } from "./storage"

describe("TripleLearning storage #given #when #then", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "triple-learning-test-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  const enabledConfig = {
    enabled: true,
    auto_extract_memories: true,
    auto_extract_skills: true,
    auto_confirm_skills_threshold: "medium" as const,
    conventions_require_confirmation: true,
    max_memories_per_session: 20,
    max_skills_per_session: 5,
    memory_context_limit: 15,
    base_dir: null as string | null,
  }

  describe("saveEntry and getEntry", () => {
    // given a storage and a memory entry
    it("should save and retrieve a memory entry", () => {
      // given
      const storage = createTripleLearningStorage(enabledConfig, tmpDir)

      // when
      const entry = storage.createEntry({
        type: "memory",
        content: "The project uses Bun as the runtime",
        category: "fact",
        confidence: "high",
        tags: ["bun", "runtime"],
        source: "manual",
        trigger: "manual",
      })

      // then
      expect(entry.id).toBeTruthy()
      expect(entry.type).toBe("memory")
      expect(entry.content).toBe("The project uses Bun as the runtime")
      expect(entry.status).toBe("active")
    })
  })

  describe("createEntry and searchEntries", () => {
    // given a storage with entries
    it("should find entries by search query", () => {
      // given
      const storage = createTripleLearningStorage(enabledConfig, tmpDir)
      storage.createEntry({
        type: "memory",
        content: "The project uses Bun for testing",
        category: "fact",
        confidence: "high",
        tags: ["bun", "test"],
        source: "manual",
        trigger: "manual",
      })
      storage.createEntry({
        type: "memory",
        content: "TypeScript strict mode is enabled",
        category: "fact",
        confidence: "high",
        tags: ["typescript"],
        source: "manual",
        trigger: "manual",
      })

      // when
      const results = storage.searchEntries("memory", "Bun")

      // then
      expect(results.length).toBe(1)
      expect(results[0].content).toContain("Bun")
    })
  })

  describe("listEntries with status filter", () => {
    // given entries with different statuses
    it("should filter by status", () => {
      // given
      const storage = createTripleLearningStorage(enabledConfig, tmpDir)
      const entry1 = storage.createEntry({
        type: "memory",
        content: "Active memory",
        category: "fact",
        confidence: "high",
        tags: [],
        source: "manual",
        trigger: "manual",
      })
      const entry2 = storage.createEntry({
        type: "memory",
        content: "To be superseded",
        category: "fact",
        confidence: "medium",
        tags: [],
        source: "manual",
        trigger: "manual",
      })

      storage.updateEntryStatus("memory", entry2.id, "superseded")

      // when
      const activeEntries = storage.listEntries("memory", "active")
      const supersededEntries = storage.listEntries("memory", "superseded")

      // then
      expect(activeEntries.length).toBe(1)
      expect(activeEntries[0].id).toBe(entry1.id)
      expect(supersededEntries.length).toBe(1)
      expect(supersededEntries[0].id).toBe(entry2.id)
    })
  })

  describe("deleteEntry", () => {
    // given an existing entry
    it("should archive an entry and remove from index", () => {
      // given
      const storage = createTripleLearningStorage(enabledConfig, tmpDir)
      const entry = storage.createEntry({
        type: "memory",
        content: "Memory to delete",
        category: "fact",
        confidence: "low",
        tags: [],
        source: "manual",
        trigger: "manual",
      })

      // when
      const deleted = storage.deleteEntry("memory", entry.id)
      const retrieved = storage.getEntry("memory", entry.id)
      const listed = storage.listEntries("memory")

      // then
      expect(deleted).toBe(true)
      expect(retrieved).toBeNull()
      expect(listed.find((e) => e.id === entry.id)).toBeUndefined()
    })
  })

  describe("getRecentContext", () => {
    // given entries of different types
    it("should return formatted context string", () => {
      // given
      const storage = createTripleLearningStorage(enabledConfig, tmpDir)
      storage.createEntry({
        type: "memory",
        content: "Important fact about the project",
        category: "fact",
        confidence: "high",
        tags: ["important"],
        source: "manual",
        trigger: "manual",
      })
      storage.createEntry({
        type: "skill",
        content: "How to run tests: use bun test",
        category: "procedure",
        confidence: "high",
        tags: ["test"],
        source: "manual",
        trigger: "manual",
      })

      // when
      const context = storage.getRecentContext()

      // then
      expect(context).toContain("Cross-Session Memories")
      expect(context).toContain("Learned Skills")
      expect(context).toContain("Important fact about the project")
      expect(context).toContain("How to run tests")
    })
  })

  describe("getStats", () => {
    // given a storage with multiple entries
    it("should return correct statistics", () => {
      // given
      const storage = createTripleLearningStorage(enabledConfig, tmpDir)
      for (let i = 0; i < 3; i++) {
        storage.createEntry({
          type: "memory",
          content: `Memory ${i}`,
          category: "fact",
          confidence: "high",
          tags: [],
          source: "manual",
          trigger: "manual",
        })
      }
      storage.createEntry({
        type: "skill",
        content: "A learned skill",
        category: "procedure",
        confidence: "high",
        tags: [],
        source: "manual",
        trigger: "manual",
      })

      // when
      const stats = storage.getStats()

      // then
      expect(stats.total_memories).toBe(3)
      expect(stats.total_skills).toBe(1)
      expect(stats.total_conventions).toBe(0)
      expect(stats.active_memories).toBe(3)
      expect(stats.active_skills).toBe(1)
    })
  })

  describe("ensureDirs", () => {
    // given a new storage instance
    it("should create all required directories", () => {
      // given
      const storage = createTripleLearningStorage(enabledConfig, tmpDir)

      // when
      storage.ensureDirs()

      // then
      expect(existsSync(storage.getMemoriesDir())).toBe(true)
      expect(existsSync(storage.getSkillsDir())).toBe(true)
      expect(existsSync(storage.getConventionsDir())).toBe(true)
    })
  })

  describe("disabled config", () => {
    // given a disabled config
    it("should still allow manual operations", () => {
      // given
      const disabledConfig = { ...enabledConfig, enabled: false }
      const storage = createTripleLearningStorage(disabledConfig, tmpDir)
      storage.ensureDirs()

      // when
      const entry = storage.createEntry({
        type: "memory",
        content: "Manual memory even when disabled",
        category: "fact",
        confidence: "low",
        tags: [],
        source: "manual",
        trigger: "manual",
      })

      // then
      expect(entry.status).toBe("active")
      expect(storage.listEntries("memory").length).toBe(1)
    })
  })
})
