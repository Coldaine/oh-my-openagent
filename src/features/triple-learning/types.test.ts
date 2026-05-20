import { describe, it, expect } from "bun:test"
import { MEMORY_TYPES, MEMORY_STATUSES, MEMORY_CONFIDENCES, MEMORY_CATEGORIES } from "./types"

describe("TripleLearning types #given #when #then", () => {
  describe("MEMORY_TYPES", () => {
    it("should contain exactly three types", () => {
      expect(MEMORY_TYPES).toEqual(["memory", "skill", "convention"])
    })
  })

  describe("MEMORY_STATUSES", () => {
    it("should contain valid statuses", () => {
      expect(MEMORY_STATUSES).toContain("active")
      expect(MEMORY_STATUSES).toContain("superseded")
      expect(MEMORY_STATUSES).toContain("archived")
    })
  })

  describe("MEMORY_CONFIDENCES", () => {
    it("should contain valid confidence levels", () => {
      expect(MEMORY_CONFIDENCES).toEqual(["low", "medium", "high"])
    })
  })

  describe("MEMORY_CATEGORIES", () => {
    it("should contain all category types", () => {
      expect(MEMORY_CATEGORIES).toContain("fact")
      expect(MEMORY_CATEGORIES).toContain("preference")
      expect(MEMORY_CATEGORIES).toContain("procedure")
      expect(MEMORY_CATEGORIES).toContain("pattern")
      expect(MEMORY_CATEGORIES).toContain("decision")
      expect(MEMORY_CATEGORIES).toContain("tool_discovery")
      expect(MEMORY_CATEGORIES).toContain("observation")
    })
  })
})
