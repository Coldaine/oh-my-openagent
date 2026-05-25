type ModelPoolScope = "category" | "agent"

const poolCounters = new Map<string, number>()
const unavailableModels = new Set<string>()

function createPoolKey(scope: ModelPoolScope, name: string, pool: string[]): string {
	return `${scope}:${name}:${pool.join("\u0000")}`
}

export function nextModel(scope: ModelPoolScope, name: string, pool: string[]): string | undefined {
	if (pool.length === 0) {
		throw new Error(`No models configured for ${scope}: ${name}`)
	}

	const poolKey = createPoolKey(scope, name, pool)
	const startIndex = poolCounters.get(poolKey) ?? 0

	for (let attempt = 0; attempt < pool.length; attempt++) {
		const counter = startIndex + attempt
		const model = pool[counter % pool.length]

		if (isModelAvailable(model)) {
			poolCounters.set(poolKey, counter + 1)
			return model
		}
	}

	return undefined
}

export function resetCounter(scope?: ModelPoolScope, name?: string, pool?: string[]): void {
	if (scope === undefined) {
		poolCounters.clear()
		return
	}

	if (name !== undefined && pool !== undefined) {
		poolCounters.delete(createPoolKey(scope, name, pool))
		return
	}

	for (const key of poolCounters.keys()) {
		if (key.startsWith(`${scope}:`)) {
			poolCounters.delete(key)
		}
	}
}

export function resetAllPoolState(): void {
	poolCounters.clear()
	unavailableModels.clear()
}

export function markUnavailable(model: string): void {
	unavailableModels.add(model)
}

export function markAvailable(model: string): void {
	unavailableModels.delete(model)
}

export function isModelAvailable(model: string): boolean {
	return !unavailableModels.has(model)
}
