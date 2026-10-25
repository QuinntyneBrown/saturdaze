import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ADMIN_AGENT_RUNS_SERVICE, AgentRunsView } from 'api';
import {
  Banner,
  Button,
  Card,
  Chip,
  Empty,
  Icon,
  PageHeader,
  Section,
  StatusRow,
} from 'components';

import { chipTone } from '../../shared/chip-tones';

/**
 * Agent runs (A7) — `docs/mocks/pages/admin.agent-runs.html`: today's runs,
 * how they ended and this month's spend against the cap, then the latest
 * runs with their usage, cost and trace id. Read-only (L2-208, L2-210).
 */
@Component({
  selector: 'sd-admin-agent-runs',
  standalone: true,
  imports: [Banner, Button, Card, Chip, Empty, Icon, PageHeader, Section, StatusRow],
  templateUrl: './agent-runs.page.html',
  styleUrl: './agent-runs.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentRunsPage {
  private readonly service = inject(ADMIN_AGENT_RUNS_SERVICE);

  protected readonly status = signal<'loading' | 'ready'>('loading');
  protected readonly view = signal<AgentRunsView | null>(null);
  protected readonly error = signal('');
  protected readonly copied = signal<string | null>(null);
  protected readonly chipTone = chipTone;

  constructor() {
    void this.load();
  }

  protected async copy(traceId: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(traceId);
      this.copied.set(traceId);
    } catch {
      // The id stays selectable on the card; nothing else depends on the copy.
    }
  }

  private async load(): Promise<void> {
    try {
      this.view.set(await this.service.list());
    } catch (err) {
      this.error.set('Could not load the agent runs. Try again in a moment.');
      console.error('AgentRunsPage load failed', err);
    } finally {
      this.status.set('ready');
    }
  }
}
