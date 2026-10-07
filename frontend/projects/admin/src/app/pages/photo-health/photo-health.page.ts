import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { ADMIN_PLACES_SERVICE, DEFAULT_ADMIN_PLACES_QUERY, HealthView } from 'api';
import {
  Banner,
  Button,
  Icon,
  List,
  PageHeader,
  PlaceRow,
  Section,
  StatCard,
  StatusRow,
} from 'components';

import { placeRowFlags } from '../../shared/chip-tones';

type Status = 'loading' | 'ready';

/** "Review 7 new photos" · "Review 1 new photo". */
export function reviewButtonText(pending: number): string {
  return `Review ${pending} new photo${pending === 1 ? '' : 's'}`;
}

/**
 * Photo health (A2, the admin home) — `docs/mocks/pages/admin.html`: one
 * stat card per catalog with the places families can recognise at a glance,
 * every flag count linking to the Places screen filtered to those places
 * (L2-112), and the six worst places below.
 */
@Component({
  selector: 'sd-admin-photo-health',
  standalone: true,
  imports: [Banner, Button, Icon, List, PageHeader, PlaceRow, Section, StatCard, StatusRow],
  templateUrl: './photo-health.page.html',
  styleUrl: './photo-health.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoHealthPage {
  private readonly places = inject(ADMIN_PLACES_SERVICE);

  protected readonly status = signal<Status>('loading');
  protected readonly health = signal<HealthView | null>(null);
  protected readonly error = signal('');

  private readonly list = this.places.list();
  /** The worst six places, from the same health-first sort the Places screen uses. */
  protected readonly worst = computed(() =>
    this.list().status === 'ready'
      ? this.list()
          .rows.slice(0, 6)
          .map((row) => ({ ...row, chips: placeRowFlags(row.flags) }))
      : [],
  );
  protected readonly reviewText = computed(() =>
    reviewButtonText(this.health()?.pendingReviews ?? 0),
  );

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    this.error.set('');
    try {
      const [health] = await Promise.all([
        this.places.health(),
        this.places.load(DEFAULT_ADMIN_PLACES_QUERY),
      ]);
      this.health.set(health);
    } catch (err) {
      this.error.set('Could not load photo health. Try again in a moment.');
      console.error('PhotoHealthPage load failed', err);
    } finally {
      this.status.set('ready');
    }
  }
}
