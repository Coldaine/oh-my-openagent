import type { AvailableCategory } from "../agents/dynamic-agent-prompt-builder"
import type { OhMyOpenCodeConfig } from "../config"
import { CATEGORY_DESCRIPTIONS } from "../tools/delegate-task/constants"
import { mergeCategories } from "../shared/merge-categories"

function formatModelForDisplay(model: string | string[] | undefined): string | undefined {
  return Array.isArray(model) ? model.join(", ") : model
}

export function createAvailableCategories(
  pluginConfig: OhMyOpenCodeConfig,
): AvailableCategory[] {
  const categories = mergeCategories(pluginConfig.categories)

  return Object.entries(categories).map(([name, categoryConfig]) => {
    const model = formatModelForDisplay(categoryConfig.model)

    return {
      name,
      description:
        pluginConfig.categories?.[name]?.description ??
        CATEGORY_DESCRIPTIONS[name] ??
        "General tasks",
      model,
    }
  })
}
