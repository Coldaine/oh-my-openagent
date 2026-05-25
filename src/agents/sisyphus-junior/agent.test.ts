import { describe, expect, test } from "bun:test"
import { createSisyphusJuniorAgentWithOverrides, SISYPHUS_JUNIOR_DEFAULTS } from "./agent"

describe("createSisyphusJuniorAgentWithOverrides model pools", () => {
  test("uses selected string model when override model is still a pool array", () => {
    //#given
    const override = { model: ["openai/gpt-5.4-mini", "openai/gpt-5.5"] }
    const selectedCategoryModel = "openai/gpt-5.4-mini"

    //#when
    const result = createSisyphusJuniorAgentWithOverrides(override, selectedCategoryModel)

    //#then
    expect(result.model).toBe(selectedCategoryModel)
    expect(Array.isArray(result.model)).toBe(false)
    expect(result.reasoningEffort).toBe("medium")
  })

  test("falls back to default string model when no selected model accompanies a pool override", () => {
    //#given
    const override = { model: ["openai/gpt-5.4-mini", "openai/gpt-5.5"] }

    //#when
    const result = createSisyphusJuniorAgentWithOverrides(override)

    //#then
    expect(result.model).toBe(SISYPHUS_JUNIOR_DEFAULTS.model)
    expect(Array.isArray(result.model)).toBe(false)
  })

  test("category pool selected string controls Sisyphus-Junior prompt variant", () => {
    //#given
    const override = { model: ["anthropic/claude-sonnet-4-6", "openai/gpt-5.5"] }
    const selectedCategoryModel = "openai/gpt-5.5"

    //#when
    const result = createSisyphusJuniorAgentWithOverrides(override, selectedCategoryModel)

    //#then
    expect(result.model).toBe(selectedCategoryModel)
    expect(result.prompt).toContain("Sisyphus-Junior")
    expect(result.permission ?? {}).toHaveProperty("apply_patch", "deny")
  })
})
