import { AgentFallbackReason, AgentRunStatus } from '../agent-draft.dto';
import { ChipView } from '../chip-view';

/** One run of `GET /api/admin/agent-runs` (L2-208, L2-210). Mirrors `AgentRunDto`. */
export interface AgentRunDto {
  readonly id: string;
  /** The Saturday, `YYYY-MM-DD`. */
  readonly weekendOf: string;
  readonly trigger: 'Scheduled' | 'OnDemand';
  readonly status: AgentRunStatus;
  readonly fallbackReason: AgentFallbackReason | null;
  readonly queuedUtc: string;
  readonly startedUtc: string | null;
  readonly finishedUtc: string | null;
  readonly rounds: number;
  readonly modelCalls: number;
  readonly toolCalls: number;
  readonly webSearches: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  readonly traceId: string | null;
  readonly policyViolations: number;
}

export interface AgentRunsDto {
  readonly runs: readonly AgentRunDto[];
  readonly totals: {
    readonly runsToday: number;
    readonly appliedToday: number;
    readonly fellBackToday: number;
    readonly spendThisMonthUsd: number;
    readonly monthlyCapUsd: number;
    readonly runsPerDayCap: number;
  };
}

/** One card of the Agent runs screen (A7), worded as the mock words it. */
export interface AgentRunRow {
  readonly id: string;
  /** "Weekend of 31 Oct · Scheduled". */
  readonly title: string;
  /** "30 Oct 2026, 12:00pm UTC · 2 rounds · 7 model calls · 48,210 in / 3,904 out · US$0.2032". */
  readonly meta: string;
  /** "Run 30 Oct 2026, 12:00pm UTC" — the card's accessible name. */
  readonly label: string;
  /** Applied, "Fell back · Timeout", Running, Queued. */
  readonly status: ChipView;
  readonly traceId: string | null;
}

/** The Agent runs screen: four totals and the latest runs (L2-210). */
export interface AgentRunsView {
  readonly runsToday: string;
  readonly runsCap: string;
  readonly appliedToday: string;
  readonly fellBackToday: string;
  /** "US$3.18". */
  readonly spend: string;
  /** "of the US$25.00 monthly cap". */
  readonly spendCap: string;
  /** 0–100, the share of the cap used. */
  readonly spendPercent: number;
  readonly runs: readonly AgentRunRow[];
}
