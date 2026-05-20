---
globs:
  - "src/agents/**/*.ts"
  - "src/agents/**/*.md"
  - "src/hooks/**/*.ts"
  - "src/tools/delegate-task/**/*.ts"
---

# Agent Change Policy

Before modifying any agent behavior, read `.omo/FORK_CHANGES.md`.

That file is the authoritative record of:
- Why each existing change was made (with sources)
- What the verdict is on each change (JUSTIFIED / SPECULATIVE / INCOMPLETE)
- What to monitor to confirm changes are working
- The template for justifying new changes

**Hard rule:** If you cannot articulate what specific OMO failure mode your change fixes AND
how you would detect in a session log that the change is working, do not make the change.

Prompt-only changes are SPECULATIVE by default. They require session evidence to become JUSTIFIED.
