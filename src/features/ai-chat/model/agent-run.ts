let generation = 0

/** Start a new agent run; invalidates in-flight requests from older runs. */
export function beginAgentRun(): number {
  generation += 1
  return generation
}

/** Cancel the current agent run (chat + TTS). */
export function cancelAgentRun(): number {
  return beginAgentRun()
}

export function isAgentRunActive(runId: number): boolean {
  return runId === generation
}

/** Vitest: isolate generation between specs that call `cancelAgentRun`. */
export function resetAgentRunGeneration(): void {
  generation = 0
}

/** Vitest: assert run id vs global generation when debugging flaky integration tests. */
export function getAgentRunGeneration(): number {
  return generation
}
