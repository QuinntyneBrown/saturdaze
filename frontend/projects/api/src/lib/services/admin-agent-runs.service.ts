import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import {
  AgentRunDto,
  AgentRunRow,
  AgentRunsDto,
  AgentRunsView,
} from '../models/admin/agent-runs.dto';
import { ChipView } from '../models/chip-view';
import { IAdminAgentRunsService } from './admin-agent-runs.service.contract';
import { utcWhen } from './admin-audit.service';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const count = (n: number): string => n.toLocaleString('en-US');
const usd = (n: number, digits: number): string => `US$${n.toFixed(digits)}`;
const plural = (n: number, one: string): string => `${n} ${one}${n === 1 ? '' : 's'}`;

/** Applied, "Fell back · Timeout", Running, Queued (L2-210). */
function statusChip(run: AgentRunDto): ChipView {
  switch (run.status) {
    case 'Applied':
      return { tone: 'accent', label: 'Applied' };
    case 'FellBack':
      return {
        tone: 'warn',
        label: run.fallbackReason ? `Fell back · ${run.fallbackReason}` : 'Fell back',
      };
    case 'Running':
      return { tone: 'neutral', label: 'Running' };
    default:
      return { tone: 'neutral', label: 'Queued' };
  }
}

/** "2026-10-31" → "31 Oct". */
function weekendLabel(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

export function toAgentRunRow(run: AgentRunDto): AgentRunRow {
  const when = utcWhen(run.startedUtc ?? run.queuedUtc);
  const usage = [
    when,
    plural(run.rounds, 'round'),
    plural(run.modelCalls, 'model call'),
    ...(run.modelCalls > 0
      ? [`${count(run.inputTokens)} in / ${count(run.outputTokens)} out`, usd(run.costUsd, 4)]
      : []),
  ];
  return {
    id: run.id,
    title: `Weekend of ${weekendLabel(run.weekendOf)} · ${run.trigger === 'Scheduled' ? 'Scheduled' : 'On demand'}`,
    meta: usage.join(' · '),
    label: `Run ${when}`,
    status: statusChip(run),
    traceId: run.traceId,
  };
}

export function toAgentRunsView(dto: AgentRunsDto): AgentRunsView {
  const t = dto.totals;
  const share = t.monthlyCapUsd > 0 ? (t.spendThisMonthUsd / t.monthlyCapUsd) * 100 : 0;
  return {
    runsToday: String(t.runsToday),
    runsCap: `of ${t.runsPerDayCap} allowed a day`,
    appliedToday: String(t.appliedToday),
    fellBackToday: String(t.fellBackToday),
    spend: usd(t.spendThisMonthUsd, 2),
    spendCap: `of the ${usd(t.monthlyCapUsd, 2)} monthly cap`,
    spendPercent: Math.min(100, Math.max(0, Math.round(share))),
    runs: dto.runs.map(toAgentRunRow),
  };
}

@Injectable({ providedIn: 'root' })
export class AdminAgentRunsService implements IAdminAgentRunsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async list(): Promise<AgentRunsView> {
    const dto = await firstValueFrom(
      this.http.get<AgentRunsDto>(`${this.baseUrl}/api/admin/agent-runs`, {
        params: { take: 50 },
      }),
    );
    return toAgentRunsView(dto);
  }
}
