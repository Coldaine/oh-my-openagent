/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { CategoryConfigSchema } from "./categories"

describe("CategoryConfigSchema", () => {
	describe("#given a category config with model", () => {
		describe("#when model is a single string", () => {
			test("#then parses successfully", () => {
				const result = CategoryConfigSchema.parse({ model: "openai/gpt-5.4-mini" })

				expect(result.model).toBe("openai/gpt-5.4-mini")
			})
		})

		describe("#when model is an array of strings", () => {
			test("#then parses successfully", () => {
				const result = CategoryConfigSchema.parse({ model: ["openai/gpt-5.4-mini", "anthropic/claude-sonnet-4-6"] })

				expect(result.model).toEqual(["openai/gpt-5.4-mini", "anthropic/claude-sonnet-4-6"])
			})
		})

		describe("#when model is an empty array", () => {
			test("#then rejects the config", () => {
				const result = CategoryConfigSchema.safeParse({ model: [] })

				expect(result.success).toBe(false)
			})
		})

		describe("#when model array includes non-string elements", () => {
			test("#then rejects the config", () => {
				const result = CategoryConfigSchema.safeParse({ model: ["openai/gpt-5.4-mini", 42] })

				expect(result.success).toBe(false)
			})
		})
	})

	describe("#given a category config without model", () => {
		describe("#when model is undefined", () => {
			test("#then parses successfully", () => {
				const result = CategoryConfigSchema.parse({ model: undefined })

				expect(result.model).toBeUndefined()
			})
		})
	})
})