import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { getOmoOpenCodeCacheDir } from "./data-path"
import { log } from "./logger"
import type { ModelRotationConfig } from "../config/schema/agent-overrides"

function getRotationCounterPath(): string {
  return join(getOmoOpenCodeCacheDir(), "model-rotation-counters.json")
}

type RotationCounters = Record<string, number>

function readRotationCounters(): RotationCounters {
  try {
    const filePath = getRotationCounterPath()
    if (!existsSync(filePath)) return {}
    const content = readFileSync(filePath, "utf-8")
    return JSON.parse(content) as RotationCounters
  } catch {
    return {}
  }
}

function writeRotationCounters(counters: RotationCounters): void {
  try {
    const filePath = getRotationCounterPath()
    const dir = join(filePath, "..")
    mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, JSON.stringify(counters, null, 2), "utf-8")
  } catch (err) {
    log("[model-rotation] failed to persist rotation counters", { error: String(err) })
  }
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function shuffleArray<T>(arr: T[], seed?: number): T[] {
  const result = [...arr]
  if (seed !== undefined) {
    const rng = seededRandom(seed)
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
  } else {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
  }
  return result
}

export function selectModelFromRotation(
  rotationConfig: ModelRotationConfig,
  agentKey: string,
): string | undefined {
  const { pool, strategy, seed } = rotationConfig
  if (pool.length === 0) return undefined

  if (pool.length === 1) return pool[0]

  const counterKey = `${agentKey}:${strategy}`
  const counters = readRotationCounters()

  switch (strategy) {
    case "round-robin": {
      const currentIndex = counters[counterKey] ?? 0
      const model = pool[currentIndex % pool.length]
      counters[counterKey] = (currentIndex + 1) % pool.length
      writeRotationCounters(counters)
      log("[model-rotation] round-robin selected", {
        agent: agentKey,
        index: currentIndex,
        model,
        poolSize: pool.length,
      })
      return model
    }

    case "shuffle": {
      const shuffledIndex = counters[counterKey] ?? 0
      const shuffled = shuffleArray(pool, seed)
      const model = shuffled[shuffledIndex % shuffled.length]
      counters[counterKey] = (shuffledIndex + 1) % pool.length
      writeRotationCounters(counters)
      log("[model-rotation] shuffle selected", {
        agent: agentKey,
        index: shuffledIndex,
        model,
      })
      return model
    }

    case "random": {
      const index = Math.floor(Math.random() * pool.length)
      const model = pool[index]
      log("[model-rotation] random selected", {
        agent: agentKey,
        index,
        model,
      })
      return model
    }

    default:
      return pool[0]
  }
}

export function selectModelFromRotationSync(
  rotationConfig: ModelRotationConfig,
  agentKey: string,
): string | undefined {
  return selectModelFromRotation(rotationConfig, agentKey)
}
