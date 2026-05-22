import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export function createTemporaryModelSelectionEventsFile(prefix: string): string {
  return join(mkdtempSync(join(tmpdir(), prefix)), "events.jsonl")
}
