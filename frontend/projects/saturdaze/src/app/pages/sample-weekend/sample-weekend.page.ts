import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  SHARED_WEEKEND_SERVICE,
  formatWeekendSpan,
  hhmm,
  type SharedWeekend,
  type WeekendDay,
} from 'api';
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
  private readonly sharedWeekends = inject(SHARED_WEEKEND_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  /** The weekend behind `?share=<token>`; `null` renders the static sample. */
  protected readonly shared = signal<SharedWeekend | null>(null);
  protected readonly isShared = computed(() => this.shared() !== null);
  protected readonly bannerTitle = computed(() =>
    this.isShared()
      ? 'Someone shared this Saturdaze weekend with you.'
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
    return shared ? formatWeekendSpan(shared.weekendOf) : 'Sat 17 May – Sun 18 May';
  });
  protected readonly saturdayHighlight = computed(() => this.highlight('Saturday'));
  protected readonly sundayHighlight = computed(() => this.highlight('Sunday'));
  protected readonly saturdayLock = computed(() => this.lockLabel('Saturday') ?? '9:00 swim');
  protected readonly sundayLock = computed(() => this.lockLabel('Sunday') ?? '10:30 church');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('share');
    if (!token) return;

    let destroyed = false;
    this.destroyRef.onDestroy(() => { destroyed = true; });
    this.sharedWeekends.load(token).then(
      (weekend) => { if (!destroyed) this.shared.set(weekend); },
      (err: unknown) => console.error('SampleWeekendPage shared load failed', err),
    );
  }

  private highlight(day: WeekendDay): string {
    const shared = this.shared();
    if (!shared) return day === 'Saturday' ? 'Lavender fields at Terre Bleu' : "Rec Room — Eli's pick";
    return shared.blocks.find((b) => b.day === day && b.kind === 'Activity')?.title
      ?? shared.blocks.find((b) => b.day === day && b.kind === 'Meal')?.title
      ?? 'Quiet day at home';
  }

  private lockLabel(day: WeekendDay): string | null {
    const locked = this.shared()?.blocks.find((b) => b.day === day && b.isLocked);
    return locked ? `${hhmm(locked.startTime)} ${locked.title.toLowerCase()}` : null;
  }
}
