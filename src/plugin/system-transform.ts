import type { CreatedHooks } from "../create-hooks"

export function createSystemTransformHandler(args: {
  hooks: CreatedHooks
}): (
  input: { sessionID?: string; model: { id: string; providerID: string; [key: string]: unknown } },
  output: { system: string[] },
) => Promise<void> {
  return async (input, output): Promise<void> => {
    const handoffSubstrate = args.hooks.handoffSubstrate?.systemTransform
    
    if (handoffSubstrate) {
      await Promise.resolve(handoffSubstrate(input, output))
    }
  }
}
