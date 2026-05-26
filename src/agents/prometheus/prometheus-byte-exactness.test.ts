/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { getPrometheusPrompt } from "./system-prompt"

type PrometheusPromptBaseline = {
  readonly name: string
  readonly model: string | undefined
  readonly disabledTools: readonly string[]
  readonly sha256: string
  readonly shouldContainQuestionTool: boolean
}

const PROMETHEUS_PROMPT_BASELINES: readonly PrometheusPromptBaseline[] = [
  {
    name: "default-enabled",
    model: undefined,
    disabledTools: [],
    sha256: "a20e5380e3ea37eb3d20804b17cdab54343d434f7908c20e271aeec395397a2c",
    shouldContainQuestionTool: true,
  },
  {
    name: "default-question-disabled",
    model: undefined,
    disabledTools: ["question"],
    sha256: "6c70e61c9726b12213d46a8be5505b571135e6dfaa8a32a64b43b2e746900ead",
    shouldContainQuestionTool: false,
  },
  {
    name: "gpt-enabled",
    model: "gpt-5.5",
    disabledTools: [],
    sha256: "f14ffe1dd4c3ad649d255da5b7cec7dd5d902b69fa5c831bb96150e54e9e494f",
    shouldContainQuestionTool: true,
  },
  {
    name: "gpt-question-disabled",
    model: "gpt-5.5",
    disabledTools: ["question"],
    sha256: "4b603f3357410cf32bc755a91ec7debca3ca6e7680ad1391e3b01eef1337baf8",
    shouldContainQuestionTool: false,
  },
  {
    name: "gemini-enabled",
    model: "gemini-3.1-pro",
    disabledTools: [],
    sha256: "1caf16ede879920c2d3f13df7b709d9bf9f8d7ad150c46447fa4a8df41d61fda",
    shouldContainQuestionTool: true,
  },
  {
    name: "gemini-question-disabled",
    model: "gemini-3.1-pro",
    disabledTools: ["question"],
    sha256: "280a97c43b61d801bfd0893aa915a83883d4069e034d03f20081c48e04b5bb29",
    shouldContainQuestionTool: false,
  },
]

describe("Prometheus prompt byte exactness", () => {
  test("#given captured Prometheus prompt baselines #then every variant keeps the same bytes", () => {
    for (const baseline of PROMETHEUS_PROMPT_BASELINES) {
      const prompt = getPrometheusPrompt(baseline.model, baseline.disabledTools)

      expect(prompt.length, baseline.name).toBeGreaterThan(0)
      expect(hashPrompt(prompt), baseline.name).toBe(baseline.sha256)
    }
  })

  test("#given Question tool availability changes #then Question examples follow disabledTools", () => {
    for (const baseline of PROMETHEUS_PROMPT_BASELINES) {
      const prompt = getPrometheusPrompt(baseline.model, baseline.disabledTools)

      expect(prompt.includes("Question({"), baseline.name).toBe(baseline.shouldContainQuestionTool)
    }
  })
})

function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex")
}
