---
description: Documentation quality standards — fires when reading or editing AGENTS.md, SKILL.md, or rules files
globs:
  - "**/AGENTS.md"
  - "**/.agents/skills/*.md"
  - ".omo/rules/*.md"
---

# Documentation Quality (NON-NEGOTIABLE)

Applies to every `AGENTS.md`, `.agents/skills/*.md`, and `.omo/rules/*.md` file in this repository.

## GENERATED DATE STAMP

Every AGENTS.md must have a `**Generated:** YYYY-MM-DD` stamp near the top. **Update it to today's date whenever you edit the file.** Stale stamps are misleading — an agent that reads a 6-month-old stamp may trust outdated constraints.

## REQUIRED SECTIONS

Every `AGENTS.md` must contain, in order:

1. **H1 title** — matches the module name or path
2. **OVERVIEW** — what the module does, file count, complexity tier
3. **FILES** or **STRUCTURE** — table or tree of the key files with one-line purpose
4. **KEY PATTERNS**, **KEY BEHAVIORS**, or **KEY CONSTRAINTS** — the non-obvious rules an agent must know before touching this module

These sections need not be exhaustive. They must not be absent.

## NO `file:///` LINKS

Never use `file:///` absolute paths in documentation. They are machine-specific and always broken on any machine that is not the original author's.

Use relative paths from the repo root instead:
- CORRECT: `[src/plugin-interface.ts](src/plugin-interface.ts)`
- WRONG: `[src/plugin-interface.ts](file:///Users/yeongyu/local-workspaces/omo/src/plugin-interface.ts)`

## CROSS-REFERENCE PARENT

Subdirectory AGENTS.md files must include a cross-reference to the parent AGENTS.md. Example:

```markdown
## CROSS-REFERENCES
- Parent: [`src/hooks/AGENTS.md`](src/hooks/AGENTS.md)
```

## SKILL FILES (`.agents/skills/*.md` and `.opencode/skills/*.md`)

Every SKILL.md file must have YAML frontmatter with at minimum:

```yaml
---
name: skill-name
description: "One-sentence description with trigger phrases listed."
---
```

Missing `name` or `description` breaks the skill loader's metadata extraction.

## MINIMUM CONTENT

Every documentation file governed by this rule must contain at least 5 lines of substantive content. Stub files with only a title are not acceptable — write a one-paragraph OVERVIEW minimum.
