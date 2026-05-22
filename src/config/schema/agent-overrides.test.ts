/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { AgentOverrideConfigSchema } from "./agent-overrides"

describe("AgentOverrideConfigSchema", () => {
	describe("#given an agent override config with model", () => {
		describe("#when model is a single string", () => {
			test("#then parses successfully", () => {
				const result = AgentOverrideConfigSchema.parse({ model: "openai/gpt-5.5" })

				expect(result.model).toBe("openai/gpt-5.5")
			})
		})

		describe("#when model is an array of strings", () => {
			test("#then rejects the config", () => {
				const result = AgentOverrideConfigSchema.safeParse({
					model: ["openai/gpt-5.5", "anthropic/claude-opus-4-7"],
				})

				expect(result.success).toBe(false)
			})
		})

		describe("#when model is an empty array", () => {
			test("#then rejects the config", () => {
				const result = AgentOverrideConfigSchema.safeParse({ model: [] })

				expect(result.success).toBe(false)
			})
		})
	})

	describe("#given an agent override config with fallback_models", () => {
		describe("#when fallback_models is a single string", () => {
			test("#then parses successfully", () => {
				const result = AgentOverrideConfigSchema.parse({ fallback_models: "openai/gpt-5.4-mini" })

				expect(result.fallback_models).toBe("openai/gpt-5.4-mini")
			})
		})

		describe("#when fallback_models is a mixed string and object array", () => {
			test("#then parses successfully", () => {
				const fallbackModels = ["openai/gpt-5.4-mini", { model: "anthropic/claude-haiku-4-5", variant: "low" }]
				const result = AgentOverrideConfigSchema.parse({ fallback_models: fallbackModels })

				expect(result.fallback_models).toEqual(fallbackModels)
			})
		})
	})
})
