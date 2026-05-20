import type { OhMyOpenCodeConfig } from "../../config"
import type { TripleLearningStorage } from "../../features/triple-learning"
import type { PluginContext } from "../types"
import type { RalphLoopHook } from "../../hooks/ralph-loop"

import {
  createClaudeCodeHooksHook,
  createKeywordDetectorHook,
  createTeamMailboxInjector,
  createTeamModeStatusInjector,
  createThinkingBlockValidatorHook,
  createToolPairValidatorHook,
} from "../../hooks"
import {
  contextCollector,
  createContextInjectorMessagesTransformHook,
} from "../../features/context-injector"
import { createTripleLearningInjectorHook } from "../../hooks/triple-learning-injector"
import { safeCreateHook } from "../../shared/safe-create-hook"

export type TransformHooks = {
  claudeCodeHooks: ReturnType<typeof createClaudeCodeHooksHook> | null
  keywordDetector: ReturnType<typeof createKeywordDetectorHook> | null
  contextInjectorMessagesTransform: ReturnType<typeof createContextInjectorMessagesTransformHook>
  teamModeStatusInjector: ReturnType<typeof createTeamModeStatusInjector> | null
  teamMailboxInjector: ReturnType<typeof createTeamMailboxInjector> | null
  thinkingBlockValidator: ReturnType<typeof createThinkingBlockValidatorHook> | null
  toolPairValidator: ReturnType<typeof createToolPairValidatorHook> | null
  tripleLearningInjector: ReturnType<typeof createTripleLearningInjectorHook> | null
}

export function createTransformHooks(args: {
  ctx: PluginContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (name: string) => boolean
  safeHookEnabled?: boolean
  ralphLoop?: RalphLoopHook | null
  tripleLearningStorage?: TripleLearningStorage | null
}): TransformHooks {
  const { ctx, pluginConfig, isHookEnabled, ralphLoop, tripleLearningStorage } = args
  const safeHookEnabled = args.safeHookEnabled ?? true

  const claudeCodeHooks = isHookEnabled("claude-code-hooks")
    ? safeCreateHook(
        "claude-code-hooks",
        () =>
          createClaudeCodeHooksHook(
            ctx,
            {
              disabledHooks: (pluginConfig.claude_code?.hooks ?? true) ? undefined : true,
              keywordDetectorDisabled: !isHookEnabled("keyword-detector"),
            },
            contextCollector,
          ),
        { enabled: safeHookEnabled },
      )
    : null

  const keywordDetector = isHookEnabled("keyword-detector")
    ? safeCreateHook(
        "keyword-detector",
        () =>
          createKeywordDetectorHook(
            ctx,
            contextCollector,
            ralphLoop ?? undefined,
            pluginConfig.keyword_detector,
          ),
        { enabled: safeHookEnabled },
      )
    : null

  const contextInjectorMessagesTransform =
    createContextInjectorMessagesTransformHook(contextCollector)

  const teamModeConfig = pluginConfig.team_mode

  const teamModeStatusInjector = teamModeConfig?.enabled
    ? safeCreateHook(
        "team-mode-status-injector",
        () => createTeamModeStatusInjector(teamModeConfig, pluginConfig.keyword_detector),
        { enabled: safeHookEnabled },
      )
    : null

  const teamMailboxInjector = teamModeConfig?.enabled
    ? safeCreateHook(
        "team-mailbox-injector",
        () => createTeamMailboxInjector(ctx, teamModeConfig),
        { enabled: safeHookEnabled },
      )
    : null

  const thinkingBlockValidator = isHookEnabled("thinking-block-validator")
    ? safeCreateHook(
        "thinking-block-validator",
        () => createThinkingBlockValidatorHook(),
        { enabled: safeHookEnabled },
      )
    : null

  const toolPairValidator = isHookEnabled("tool-pair-validator")
    ? safeCreateHook(
        "tool-pair-validator",
        () => createToolPairValidatorHook(),
        { enabled: safeHookEnabled },
      )
    : null

  const tripleLearningInjector = tripleLearningStorage && isHookEnabled("triple-learning-injector")
    ? safeCreateHook(
        "triple-learning-injector",
        () => createTripleLearningInjectorHook({ storage: tripleLearningStorage }),
        { enabled: safeHookEnabled },
      )
    : null

  return {
    claudeCodeHooks,
    keywordDetector,
    contextInjectorMessagesTransform,
    teamModeStatusInjector,
    teamMailboxInjector,
    thinkingBlockValidator,
    toolPairValidator,
    tripleLearningInjector,
  }
}
