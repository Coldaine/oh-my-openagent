import { z } from "zod"

export const TripleLearningConfigSchema = z.object({
  enabled: z.boolean().default(false),
  auto_extract_memories: z.boolean().default(true),
  auto_extract_skills: z.boolean().default(true),
  auto_confirm_skills_threshold: z.enum(["low", "medium", "high"]).default("high"),
  conventions_require_confirmation: z.boolean().default(true),
  max_memories_per_session: z.number().int().min(1).max(100).default(20),
  max_skills_per_session: z.number().int().min(1).max(50).default(5),
  memory_context_limit: z.number().int().min(1).max(100).default(15),
  base_dir: z.string().nullable().default(null),
})

export type TripleLearningConfigType = z.infer<typeof TripleLearningConfigSchema>
