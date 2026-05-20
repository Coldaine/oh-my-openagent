import { describe, it, expect } from "bun:test"
import { extractMemories, extractFromSessionData } from "./extraction"

describe("TripleLearning extraction #given #when #then", () => {
  describe("extractMemories", () => {
    // given a successful tool execution with meaningful output
    it("should extract memories from successful tool output", () => {
      // given
      const input = {
        toolName: "glob",
        toolInput: "search for test files",
        toolOutput: "Found 5 test files in src/features/ directory. The project uses `bun test` framework with given/when/then pattern.",
        wasSuccessful: true,
        source: "tool:glob",
      }

      // when
      const result = extractMemories(input)

      // then
      expect(result.entries.length).toBeGreaterThan(0)
      const bunEntry = result.entries.find((e) => e.content.includes("bun test"))
      expect(bunEntry).toBeTruthy()
      expect(bunEntry?.tags).toContain("bun test")
    })

    // given a failed tool execution
    it("should return empty for failed executions", () => {
      // given
      const input = {
        toolName: "bash",
        toolInput: "rm -rf /",
        toolOutput: "Permission denied",
        wasSuccessful: false,
        source: "tool:bash",
      }

      // when
      const result = extractMemories(input)

      // then
      expect(result.entries.length).toBe(0)
    })

    // given short tool output
    it("should return empty for very short output", () => {
      // given
      const input = {
        toolName: "glob",
        toolInput: "",
        toolOutput: "OK",
        wasSuccessful: true,
        source: "tool:glob",
      }

      // when
      const result = extractMemories(input)

      // then
      expect(result.entries.length).toBe(0)
    })

    // given procedure-like content
    it("should classify procedure content as skill type", () => {
      // given
      const input = {
        toolName: "read",
        toolInput: "",
        toolOutput: "To run the tests, execute `bun test` from the project root. First install dependencies with `bun install`.",
        wasSuccessful: true,
        source: "tool:read",
      }

      // when
      const result = extractMemories(input)

      // then
      expect(result.entries.length).toBeGreaterThan(0)
      const procedureEntry = result.entries.find((e) => e.category === "procedure")
      expect(procedureEntry).toBeTruthy()
      expect(procedureEntry?.type).toBe("skill")
    })

    // given decision-like content
    it("should classify decision content as convention type", () => {
      // given
      const input = {
        toolName: "read",
        toolInput: "",
        toolOutput: "We decided to use Bun as the JavaScript runtime because of its native TypeScript support and fast test runner.",
        wasSuccessful: true,
        source: "tool:read",
      }

      // when
      const result = extractMemories(input)

      // then
      expect(result.entries.length).toBeGreaterThan(0)
      const decisionEntry = result.entries.find((e) => e.category === "decision")
      expect(decisionEntry).toBeTruthy()
      expect(decisionEntry?.type).toBe("convention")
    })
  })

  describe("extractFromSessionData", () => {
    // given a successful session with assistant messages
    it("should extract learnings from session messages", () => {
      // given
      const input = {
        sessionTitle: "Implement feature X",
        messages: [
          { role: "user", content: "How do I implement feature X?" },
          { role: "assistant", content: "To implement feature X, you need to create a new module in src/features/ and register it in the plugin system." },
          { role: "user", content: "Thanks, that worked!" },
          { role: "assistant", content: "The codebase uses barrel exports in index.ts files for all feature modules." },
        ],
        wasSuccessful: true,
        source: "session:session_abc123",
      }

      // when
      const result = extractFromSessionData(input)

      // then
      expect(result.entries.length).toBeGreaterThan(0)
    })

    // given a failed session
    it("should return empty for unsuccessful sessions", () => {
      // given
      const input = {
        sessionTitle: "Failed experiment",
        messages: [
          { role: "user", content: "Try something" },
          { role: "assistant", content: "This approach did not work due to API limitations." },
        ],
        wasSuccessful: false,
        source: "session:session_abc123",
      }

      // when
      const result = extractFromSessionData(input)

      // then
      expect(result.entries.length).toBe(0)
    })
  })
})
