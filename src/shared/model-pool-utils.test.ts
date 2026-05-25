/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { extractSingleModel, isModelPool, normalizeModelToPool } from "./model-pool-utils"

describe("isModelPool", () => {
	describe("#given an array with multiple string entries", () => {
		describe("#when checking whether it is a model pool", () => {
			test("#then returns true", () => {
				expect(isModelPool(["a", "b"])).toBe(true)
			})
		})
	})

	describe("#given a single string", () => {
		describe("#when checking whether it is a model pool", () => {
			test("#then returns false", () => {
				expect(isModelPool("a")).toBe(false)
			})
		})
	})

	describe("#given an empty array", () => {
		describe("#when checking whether it is a model pool", () => {
			test("#then returns false", () => {
				expect(isModelPool([])).toBe(false)
			})
		})
	})

	describe("#given an array with a non-string entry", () => {
		describe("#when checking whether it is a model pool", () => {
			test("#then returns false", () => {
				expect(isModelPool(["a", 1])).toBe(false)
			})
		})
	})

	describe("#given null", () => {
		describe("#when checking whether it is a model pool", () => {
			test("#then returns false", () => {
				expect(isModelPool(null)).toBe(false)
			})
		})
	})

	describe("#given a plain object", () => {
		describe("#when checking whether it is a model pool", () => {
			test("#then returns false", () => {
				expect(isModelPool({})).toBe(false)
			})
		})
	})
})

describe("normalizeModelToPool", () => {
	describe("#given a single model string", () => {
		describe("#when normalizing it to a pool", () => {
			test("#then returns a one-element array", () => {
				expect(normalizeModelToPool("a")).toEqual(["a"])
			})
		})
	})

	describe("#given an existing model pool", () => {
		describe("#when normalizing it to a pool", () => {
			test("#then returns the array as-is", () => {
				const pool = ["a", "b"]

				expect(normalizeModelToPool(pool)).toBe(pool)
				expect(normalizeModelToPool(pool)).toEqual(["a", "b"])
			})
		})
	})
})

describe("extractSingleModel", () => {
	describe("#given a model pool with multiple entries", () => {
		describe("#when extracting a single model", () => {
			test("#then returns the first model", () => {
				expect(extractSingleModel(["a", "b"])).toBe("a")
			})
		})
	})

	describe("#given a model pool with one entry", () => {
		describe("#when extracting a single model", () => {
			test("#then returns the only model", () => {
				expect(extractSingleModel(["a"])).toBe("a")
			})
		})
	})
})
