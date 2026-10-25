import { InjectionToken } from '@angular/core';

import { AgentRunsView } from '../models/admin/agent-runs.dto';

/**
 * Contract for Saturdaze Admin's agent runs (L2-208, L2-210). The Agent runs
 * page injects `ADMIN_AGENT_RUNS_SERVICE` and depends only on this interface.
 */
export interface IAdminAgentRunsService {
  /** `GET /api/admin/agent-runs?take=50`: the latest runs and the totals. */
  list(): Promise<AgentRunsView>;
}

export const ADMIN_AGENT_RUNS_SERVICE = new InjectionToken<IAdminAgentRunsService>(
  'ADMIN_AGENT_RUNS_SERVICE',
);
