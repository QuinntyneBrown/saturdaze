import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { Chip } from '../chip/chip';
import { navigateInApp } from '../shared/in-app-link';

export type StatTone = 'leaf' | 'sun' | 'sky';

/** One flag line: a count chip and a label, linking to the list it counts. */
export interface StatLink {
  readonly count: number;
  readonly label: string;
  readonly href: string;
}

/**
 * A catalog's photo coverage on the admin Photo health screen (L2-112).
 * Mirrors `.card.stat` in docs/mocks/pages/admin.html: the label, the
 * "16 of 20" figure with its bar, and a list of flag counts that each open
 * the Places screen filtered to those places.
 */
@Component({
  selector: 'sd-stat-card',
  standalone: true,
  imports: [Chip],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card card--pad-lg stat',
    role: 'region',
    '[attr.aria-label]': 'label()',
  },
})
export class StatCard {
  private readonly router = inject(Router, { optional: true });

  /** The catalog: "Activities". */
  readonly label = input<string>('');
  /** Places with a primary photo that shows. */
  readonly figure = input<number>(0);
  /** Places in the catalog. */
  readonly total = input<number>(0);
  /** What the figure counts: "with a primary photo that shows". */
  readonly caption = input<string>('with a primary photo that shows');
  readonly tone = input<StatTone>('leaf');
  readonly links = input<readonly StatLink[]>([]);

  /** 0–100, rounded; 0 for an empty catalog. */
  readonly percent = computed(() => {
    const total = this.total();
    return total === 0 ? 0 : Math.round((this.figure() / total) * 100);
  });

  protected open(event: MouseEvent, href: string): void {
    if (this.router) navigateInApp(this.router, event, href);
  }
}
