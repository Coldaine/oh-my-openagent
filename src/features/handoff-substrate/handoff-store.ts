import { log } from "../../shared/logger"

export interface HandoffState {
  plan: string
  updatedAt: number
}

const handoffStates = new Map<string, HandoffState>()

export function setHandoff(sessionID: string, plan: string): void {
  handoffStates.set(sessionID, {
    plan,
    updatedAt: Date.now(),
  })
  log(`[handoff-substrate] Handoff plan stored for session ${sessionID}`, { 
    planLength: plan.length,
    sessionID
  })
}

export function getHandoff(sessionID: string): HandoffState | undefined {
  return handoffStates.get(sessionID)
}

export function clearHandoff(sessionID: string): void {
  handoffStates.delete(sessionID)
}
