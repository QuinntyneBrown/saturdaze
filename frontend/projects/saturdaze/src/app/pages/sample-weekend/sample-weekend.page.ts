import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { API_BASE_URL } from 'api';
import {
  Anticipate,
  Button,
  Card,
  Chip,
  DayCard,
  Hero,
  Icon,
  WeatherDay,
  WeatherStrip,
  Section,
} from 'components';

interface SharedWeekendDto {
  readonly weekendOf: string;
  readonly blocks: ReadonlyArray<{
    readonly day: 'Saturday' | 'Sunday';
    readonly kind: string;
    readonly title: string;
    readonly isLocked: boolean;
  }>;
}

@Component({
  selector: 'app-sample-weekend',
  standalone: true,
  imports: [
    RouterLink,
    Anticipate,
    Button,
    Card,
    Chip,
    DayCard,
    Hero,
    Icon,
    Section,
    WeatherDay,
    WeatherStrip,
  ],
  templateUrl: './sample-weekend.page.html',
  styleUrl: './sample-weekend.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SampleWeekendPage {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);

  protected readonly shared = signal<SharedWeekendDto | null>(null);
  protected readonly isShared = computed(() => this.shared() !== null);
  protected readonly bannerTitle = computed(() =>
    this.isShared()
      ? 'Sara shared this Saturdaze weekend with you.'
      : 'This is a sample weekend for the Browns.',
  );
  protected readonly bannerBody = computed(() =>
    this.isShared()
      ? 'Read-only preview. Sign in to make changes, lock blocks, or remix it for your family.'
      : 'Yours would be tuned to your kids, locks, location, and weather.',
  );
  protected readonly heroGreeting = computed(() =>
    this.isShared() ? 'Weekend preview' : 'Morning, sample family',
  );
  protected readonly heroSubtitle = computed(() => {
    const shared = this.shared();
    if (!shared) {
      return 'Sat & Sun are looking warm. This draft shows the kind of plan Saturdaze sends Friday at 6pm.';
    }

    return `${this.highlight('Saturday')} Saturday, ${this.highlight('Sunday')} Sunday. Shared read-only from Saturdaze.`;
  });
  protected readonly forecastSubtitle = computed(() => {
    const shared = this.shared();
    return shared ? formatRange(shared.weekendOf) : 'Sat 17 May – Sun 18 May';
  });
  protected readonly saturdayHighlight = computed(() => this.highlight('Saturday'));
  protected readonly sundayHighlight = computed(() => this.highlight('Sunday'));
  protected readonly saturdayLock = computed(() => this.lockLabel('Saturday') ?? '9:00 swim');
  protected readonly sundayLock = computed(() => this.lockLabel('Sunday') ?? '10:30 church');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('share');
    if (token) {
      this.http.get<SharedWeekendDto>(`${this.baseUrl}/api/weekends/shared/${encodeURIComponent(token)}`)
        .subscribe({
          next: (dto) => this.shared.set(dto),
          error: (err) => console.error('SampleWeekendPage shared load failed', err),
        });
    }
  }

  private highlight(day: 'Saturday' | 'Sunday'): string {
    const shared = this.shared();
    if (!shared) return day === 'Saturday' ? 'Lavender fields at Terre Bleu' : "Rec Room — Eli's pick";
    return shared.blocks.find((b) => b.day === day && b.kind === 'Activity')?.title
      ?? shared.blocks.find((b) => b.day === day && b.kind === 'Meal')?.title
      ?? 'Quiet day at home';
  }

  private lockLabel(day: 'Saturday' | 'Sunday'): string | null {
    const locked = this.shared()?.blocks.find((b) => b.day === day && b.isLocked);
    return locked?.title ?? null;
  }
}

function formatRange(saturdayIso: string): string {
  const [y, m, d] = saturdayIso.split('-').map(Number);
  const sat = new Date(Date.UTC(y!, m! - 1, d!));
  const sun = new Date(sat);
  sun.setUTCDate(sun.getUTCDate() + 1);
  const month = sat.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `Sat ${sat.getUTCDate()} ${month} – Sun ${sun.getUTCDate()} ${month}`;
}
