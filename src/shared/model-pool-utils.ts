export type ModelPool = string[]

export function isModelPool(model: unknown): model is ModelPool {
	return Array.isArray(model) && model.length > 0 && model.every((entry) => typeof entry === "string")
}

export function normalizeModelToPool(model: string | ModelPool): ModelPool {
	return Array.isArray(model) ? model : [model]
}

export function extractSingleModel(pool: ModelPool): string {
	return pool[0]
}
