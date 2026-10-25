/**
 * Agent Draft View — what the Weekend page shows about the agents (L2-211).
 */
export interface AgentDraftView {
  /**
   * Drafting — the latest run is queued or running: the status row shows and
   * the plan is busy.
   */
  readonly drafting: boolean;
  /**
   * Notice — "This is the standard plan" banner text; null when no run fell back.
   */
  readonly notice: string | null;
  /**
   * Can Retry — the fallback was Error, Timeout or Invalid, so "Try again" is offered.
   */
  readonly canRetry: boolean;
}
