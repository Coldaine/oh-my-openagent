import { beforeEach, describe, expect, test } from "bun:test"
import { resolveModelPipeline } from "./model-resolution-pipeline"
import { resetAllPoolState } from "./model-pool-state"

describe("resolveModelPipeline wrapper", () => {
  beforeEach(() => {
    resetAllPoolState()
  })

  test("handles explicit string user models without pool normalization", () => {
    // given
    const result = resolveModelPipeline({
      intent: {
        userModel: "openai/gpt-5.4-mini",
      },
      constraints: {
        availableModels: new Set<string>(["openai/gpt-5.4-mini"]),
      },
    })

    // when / then
    expect(result).toEqual({ model: "openai/gpt-5.4-mini", provenance: "override" })
  })

  test("handles category default string models after upstream pool selection", () => {
    // given
    const result = resolveModelPipeline({
      intent: {
        categoryDefaultModel: "openai/gpt-5.5",
      },
      constraints: {
        availableModels: new Set<string>(["openai/gpt-5.5"]),
      },
    })

    // when / then
    expect(result).toEqual({
      model: "openai/gpt-5.5",
      provenance: "category-default",
      attempted: ["openai/gpt-5.5"],
    })
  })

  test("builder-style callers still pass a selected string model into the pipeline", () => {
    // given
    const selectedModelFromBuilder = "anthropic/claude-sonnet-4-6"

    // when
    const result = resolveModelPipeline({
      intent: {
        userModel: selectedModelFromBuilder,
      },
      constraints: {
        availableModels: new Set<string>(),
      },
      policy: {
        systemDefaultModel: "openai/gpt-5.4-mini",
      },
    })

    // then
    expect(result?.model).toBe(selectedModelFromBuilder)
    expect(Array.isArray(result?.model)).toBe(false)
    expect(result?.provenance).toBe("override")
  })

  test("rotates category model pools by category name", () => {
    // given
    const pool = ["openai/gpt-5.4-mini", "anthropic/claude-sonnet-4-6"]

    // when
    const first = resolveModelPipeline({
      intent: {
        categoryDefaultModel: pool,
        categoryName: "quick",
      },
      constraints: {
        availableModels: new Set<string>(),
      },
    })
    const second = resolveModelPipeline({
      intent: {
        categoryDefaultModel: pool,
        categoryName: "quick",
      },
      constraints: {
        availableModels: new Set<string>(),
      },
    })

    // then
    expect(first?.model).toBe("openai/gpt-5.4-mini")
    expect(second?.model).toBe("anthropic/claude-sonnet-4-6")
  })
})
