import { createHash } from "node:crypto"
import { describe, expect, test } from "bun:test"
import { createAtlasAgent, type AtlasPromptSource, type OrchestratorContext } from "./agent"

type VariantPromptCase = {
  readonly variant: AtlasPromptSource
  readonly model: string
  readonly expectedHash: string
  readonly expectedLength: number
}

const BASE_CONTEXT = {
  availableAgents: [
    {
      name: "oracle",
      description: "Read-only architecture reviewer",
      metadata: {
        category: "advisor",
        cost: "EXPENSIVE",
        triggers: [{ domain: "Architecture", trigger: "Need design review" }],
        promptAlias: "Oracle",
      },
    },
    {
      name: "explore",
      description: "Fast codebase searcher",
      metadata: {
        category: "exploration",
        cost: "CHEAP",
        triggers: [{ domain: "Code search", trigger: "Need repository context" }],
        promptAlias: "Explore",
      },
    },
  ],
  availableSkills: [
    {
      name: "programming",
      description: "Strict TypeScript implementation discipline",
      location: "user",
    },
    {
      name: "git-master",
      description: "Atomic git operations",
      location: "plugin",
    },
    {
      name: "frontend-ui-ux",
      description: "Premium UI guidance",
      location: "project",
    },
  ],
  userCategories: {
    custom: { description: "Custom deterministic category", temperature: 0.7 },
    quick: { description: "User quick override", temperature: 0.2 },
  },
} satisfies OrchestratorContext

const VARIANT_PROMPT_CASES = [
  {
    variant: "default",
    model: "anthropic/claude-sonnet-4-6",
    expectedHash: "598fade6b61a45e504f2b63c8b8959d03ae03d715b1880ad9dd15ab819ccd430",
    expectedLength: 27533,
  },
  {
    variant: "gpt",
    model: "openai/gpt-5.5",
    expectedHash: "8bb96922a13d19aacf2ecbc96e2bedc96e2775c567f3632a88b2e33d53a92843",
    expectedLength: 26354,
  },
  {
    variant: "gemini",
    model: "google/gemini-3.1-pro",
    expectedHash: "2b8000d3163e81cdded548a8136a6eea0036b41964772006c693fa18d956f686",
    expectedLength: 29294,
  },
  {
    variant: "kimi",
    model: "moonshotai/kimi-k2.6",
    expectedHash: "08af6f8d1f76d781ca1ebbd2baec84af74f8ea116ffdcb613126fd85e45e204b",
    expectedLength: 27772,
  },
  {
    variant: "opus-4-7",
    model: "anthropic/claude-opus-4-7",
    expectedHash: "ae22acab2ec3a6f31c8ac76ec73a2822048e87813a02641d910c15fdf9801b3c",
    expectedLength: 28408,
  },
] satisfies readonly VariantPromptCase[]

const RUNTIME_PLACEHOLDERS = [
  "{CATEGORY_SECTION}",
  "{AGENT_SECTION}",
  "{DECISION_MATRIX}",
  "{SKILLS_SECTION}",
  "{{CATEGORY_SKILLS_DELEGATION_GUIDE}}",
] as const

describe("Atlas prompt byte preservation", () => {
  for (const promptCase of VARIANT_PROMPT_CASES) {
    test(`#given ${promptCase.variant} model #when Atlas prompt renders #then hash matches the baseline`, () => {
      const prompt = getAtlasPromptText({ ...BASE_CONTEXT, model: promptCase.model })

      expect(createHash("sha256").update(prompt).digest("hex")).toBe(promptCase.expectedHash)
      expect(prompt.length).toBe(promptCase.expectedLength)
    })
  }
})

describe("Atlas prompt runtime section injection", () => {
  test("#given unique live context markers #when prompt renders #then placeholders are resolved", () => {
    const prompt = getAtlasPromptText({
      model: "anthropic/claude-sonnet-4-6",
      availableAgents: [
        {
          name: "unique-agent-section-marker",
          description: "UNIQUE_AGENT_SECTION_VALUE",
          metadata: {
            category: "advisor",
            cost: "EXPENSIVE",
            triggers: [{ domain: "Runtime", trigger: "Unique agent marker" }],
          },
        },
      ],
      availableSkills: [
        {
          name: "unique-guide-skill-marker",
          description: "Unique guide skill marker",
          location: "user",
        },
      ],
      userCategories: {
        "unique-category-section-marker": {
          description: "UNIQUE_CATEGORY_SECTION_VALUE",
          temperature: 0.4,
        },
      },
    })

    expect(prompt).toContain("UNIQUE_CATEGORY_SECTION_VALUE")
    expect(prompt).toContain("UNIQUE_AGENT_SECTION_VALUE")
    expect(prompt).toContain("unique-guide-skill-marker")
    for (const placeholder of RUNTIME_PLACEHOLDERS) {
      expect(prompt).not.toContain(placeholder)
    }
  })
})

function getAtlasPromptText(ctx: OrchestratorContext): string {
  const prompt = createAtlasAgent(ctx).prompt
  if (typeof prompt === "string") return prompt
  throw new TypeError("Atlas prompt must be a string")
}
