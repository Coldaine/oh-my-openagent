import { describe, expect, test } from "bun:test"
import { AgentOverridesSchema, AgentOverrideConfigSchema } from "./agent-overrides"

describe("AgentOverridesSchema", () => {
  test("preserves custom agent keys after parsing", () => {
    const input = {
      sisyphus: { model: "anthropic/claude-opus-4-6" },
      "technical-writer": {
        model: "anthropic/claude-sonnet-4-6",
        temperature: 0.3,
        prompt_append: "You are a technical writer.",
      },
    }

    const result = AgentOverridesSchema.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sisyphus).toBeDefined()
      expect(result.data["technical-writer"]).toBeDefined()
      expect(result.data["technical-writer"]?.model).toBe("anthropic/claude-sonnet-4-6")
      expect(result.data["technical-writer"]?.temperature).toBe(0.3)
    }
  })

  test("validates custom agent keys against AgentOverrideConfigSchema", () => {
    const input = {
      "custom-agent": {
        model: "provider/model",
        temperature: 5, // invalid: max is 2
      },
    }

    const result = AgentOverridesSchema.safeParse(input)

    expect(result.success).toBe(false)
  })
})

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

