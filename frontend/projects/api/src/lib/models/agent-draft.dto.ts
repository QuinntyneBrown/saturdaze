/**
 * Agent Run Status — where an agent draft is (L2-203).
 */
export type AgentRunStatus = 'Queued' | 'Running' | 'Applied' | 'FellBack';

/**
 * Agent Fallback Reason — why the planner's weekend stands (L2-205).
 */
export type AgentFallbackReason =
  | 'Disabled'
  | 'Error'
  | 'Timeout'
  | 'Budget'
  | 'Policy'
  | 'Invalid';

/**
 * Plan Source — who made the weekend's blocks (L2-202).
 */
export type PlanSource = 'Planner' | 'Agents';

/**
 * Agent Draft Dto — the latest agent run for a weekend: `agentDraft` on the
 * weekend, and the body of `POST /api/weekends/{id}/drafts` and
 * `GET /api/weekends/{id}/drafts/latest` (L2-203, L2-205).
 */
export interface AgentDraftDto {
  readonly runId: string;
  readonly status: AgentRunStatus;
  readonly trigger: 'Scheduled' | 'OnDemand';
  readonly requestedUtc: string;
  readonly finishedUtc: string | null;
  readonly fallbackReason: AgentFallbackReason | null;
  /**
   * Notice — the family-facing sentence for a fallback; null otherwise.
   */
  readonly notice: string | null;
}
