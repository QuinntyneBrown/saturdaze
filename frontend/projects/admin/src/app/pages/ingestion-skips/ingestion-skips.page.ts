import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ADMIN_AUDIT_SERVICE, IngestionRunSkipsView } from 'api';
import { Banner, Card, Chip, Empty, PageHeader, StatusRow } from 'components';

import { chipTone } from '../../shared/chip-tones';

/**
 * Ingestion photo skips (A6) — `docs/mocks/pages/admin.ingestion-skips.html`:
 * each run's photo skip reasons under its start time, read-only; a place
 * that still exists links to its photos (L2-120 AC5).
 */
@Component({
  selector: 'sd-admin-ingestion-skips',
  standalone: true,
  imports: [Banner, Card, Chip, Empty, PageHeader, StatusRow],
  templateUrl: './ingestion-skips.page.html',
  styleUrl: './ingestion-skips.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngestionSkipsPage {
  private readonly audit = inject(ADMIN_AUDIT_SERVICE);

  protected readonly status = signal<'loading' | 'ready'>('loading');
  protected readonly runs = signal<IngestionRunSkipsView[]>([]);
  protected readonly error = signal('');
  protected readonly chipTone = chipTone;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.runs.set(await this.audit.ingestionSkips());
    } catch (err) {
      this.error.set('Could not load the ingestion runs. Try again in a moment.');
      console.error('IngestionSkipsPage load failed', err);
    } finally {
      this.status.set('ready');
    }
  }
}
