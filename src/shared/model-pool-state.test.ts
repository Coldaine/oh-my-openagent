/// <reference types="bun-types" />

import { beforeEach, describe, expect, test } from "bun:test"
import { isModelAvailable, markAvailable, markUnavailable, nextModel, resetAllPoolState, resetCounter } from "./model-pool-state"

describe("model-pool-state", () => {
	const pool = ["openai/gpt-5.4-mini", "openai/gpt-5.5", "anthropic/claude-sonnet-4.6"]

	beforeEach(() => {
		resetAllPoolState()
		for (const model of pool) {
			markAvailable(model)
		}
		markAvailable("google/gemini-3.1-pro")
	})

	describe("#given a category with a model pool", () => {
		describe("#when nextModel is called repeatedly", () => {
			test("#then cycles through models using round-robin order", () => {
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.5")
				expect(nextModel("category", "quick", pool)).toBe("anthropic/claude-sonnet-4.6")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
			})
		})
	})

	describe("#given an agent uses the same model pool as a category", () => {
		describe("#when the category counter has advanced", () => {
			test("#then the agent starts from the beginning without state leakage", () => {
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.5")

				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("anthropic/claude-sonnet-4.6")
				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.5")
			})
		})
	})

	describe("#given two categories share the same model pool", () => {
		describe("#when one category advances its counter", () => {
			test("#then the other category starts from the beginning", () => {
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.5")

				expect(nextModel("category", "deep", pool)).toBe("openai/gpt-5.4-mini")
			})
		})
	})

	describe("#given a category counter has advanced", () => {
		describe("#when resetCounter is called for that category pool", () => {
			test("#then only that category starts over", () => {
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "deep", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.5")
				expect(nextModel("category", "deep", pool)).toBe("openai/gpt-5.5")

				resetCounter("category", "quick", pool)

				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "deep", pool)).toBe("anthropic/claude-sonnet-4.6")
			})
		})
	})

	describe("#given multiple counters have advanced", () => {
		describe("#when resetCounter is called without a scope", () => {
			test("#then all counters start over", () => {
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.5")
				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.5")

				resetCounter()

				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.4-mini")
			})
		})
	})

	describe("#given category and agent counters have advanced", () => {
		describe("#when resetCounter is called for only the agent scope", () => {
			test("#then category counters keep their current positions", () => {
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.5")
				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.5")

				resetCounter("agent")

				expect(nextModel("agent", "sisyphus", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("anthropic/claude-sonnet-4.6")
			})
		})
	})

	describe("#given a model is marked unavailable", () => {
		describe("#when nextModel would select that model", () => {
			test("#then skips to the next available model", () => {
				markUnavailable("openai/gpt-5.5")

				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
				expect(nextModel("category", "quick", pool)).toBe("anthropic/claude-sonnet-4.6")
				expect(nextModel("category", "quick", pool)).toBe("openai/gpt-5.4-mini")
			})
		})
	})

	describe("#given a model availability changes", () => {
		describe("#when checking availability", () => {
			test("#then reflects unavailable and available states", () => {
				expect(isModelAvailable("google/gemini-3.1-pro")).toBe(true)

				markUnavailable("google/gemini-3.1-pro")
				expect(isModelAvailable("google/gemini-3.1-pro")).toBe(false)

				markAvailable("google/gemini-3.1-pro")
				expect(isModelAvailable("google/gemini-3.1-pro")).toBe(true)
			})
		})
	})

	describe("#given every model in a pool is unavailable", () => {
		describe("#when nextModel is called", () => {
			test("#then returns undefined so callers can use fallback resolution", () => {
				for (const model of pool) {
					markUnavailable(model)
				}

				expect(nextModel("category", "quick", pool)).toBeUndefined()
			})
		})
	})
})
