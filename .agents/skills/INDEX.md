# Skills Index

Invoke via `/oh-my-openagent:<skill-name>` or use the trigger phrases listed below.

| Skill | Trigger Phrases | Description | File |
|-------|----------------|-------------|------|
| `hyperplan` | `hyperplan`, `hpp`, `/hyperplan`, `adversarial plan`, `hostile planning`, `cross-critique plan` | Adversarial multi-agent planning. Spawns 5 hostile team members that cross-critique each other, distills defensible insights, then hands off to the `plan` agent for formalization. Requires `team_mode.enabled`. | [hyperplan/SKILL.md](.agents/skills/hyperplan/SKILL.md) |
| `publish` | `publish`, `release`, `deploy`, `npm publish` | Publish oh-my-opencode to npm via GitHub Actions workflow. Requires a version bump argument (`patch`, `minor`, or `major`). Includes Discord announcement step. | [publish/SKILL.md](.agents/skills/publish/SKILL.md) |
| `work-with-pr` | `create a PR`, `implement and PR`, `work on this and make a PR`, `implement issue`, `land this as a PR`, `work-with-pr`, `PR workflow`, `implement end to end`, `implement X` (if PR delivery implied) | Full PR lifecycle: git worktree setup → implementation → atomic commits → PR creation → unbounded verification loop (CI + review-work + Cubic approval) → merge. Auto-cleanup after merge. | [work-with-pr/SKILL.md](.agents/skills/work-with-pr/SKILL.md) |
| `github-triage` | `triage`, `triage issues`, `triage PRs`, `github triage` | Read-only GitHub triage for issues and PRs. 1 item = 1 background task. Writes evidence-backed reports to `/tmp/{datetime}/`. No GitHub mutations — reports only. | [github-triage/SKILL.md](.agents/skills/github-triage/SKILL.md) |
| `remove-deadcode` | `remove dead code`, `dead code`, `cleanup`, `remove unused` | Remove unused code with LSP-verified safety and atomic commits. Orchestrator scans + batches; deep agents do the removals in parallel. Never removes entry points. | [remove-deadcode/SKILL.md](.agents/skills/remove-deadcode/SKILL.md) |
| `get-unpublished-changes` | `unpublished changes`, `changelog`, `what changed`, `whats new` | Compare HEAD with the latest published npm version and list all unpublished changes. Reads actual diffs — does not just copy commit messages. | [get-unpublished-changes/SKILL.md](.agents/skills/get-unpublished-changes/SKILL.md) |
| `pre-publish-review` | `pre-publish review`, `review before publish`, `release review`, `pre-release review`, `ready to publish?`, `can I publish?`, `pre-publish`, `safe to publish`, `publishing review`, `pre-publish check` | 16-agent pre-publish release gate. Runs `/get-unpublished-changes`, spawns up to 10 ultrabrain agents for per-change deep analysis, invokes review-work (5 agents), and 1 oracle for release synthesis. Use before every npm publish. | [pre-publish-review/SKILL.md](.agents/skills/pre-publish-review/SKILL.md) |
| `omomomo` | `omomomo`, `about`, `easter egg` | Easter egg command. Prints a celebratory message about oh-my-opencode. | [omomomo/SKILL.md](.agents/skills/omomomo/SKILL.md) |

## Notes

- Skills are discovered from `.agents/skills/` (project scope) and `.opencode/skills/` (project scope legacy) in addition to the user-global skills directory.
- Skills loaded via `SkillMcpManager` (Tier-3) can embed their own MCP servers in YAML frontmatter.
- `work-with-pr-workspace` is a workspace-scoped variant of `work-with-pr` in `.agents/skills/work-with-pr-workspace/`.
