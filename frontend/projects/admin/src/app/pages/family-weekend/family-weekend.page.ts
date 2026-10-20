import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { ADMIN_FAMILIES_SERVICE, DayView, FamilyHeaderView, PastWeekendRow, WeekendDay } from 'api';
import {
  Banner,
  Block,
  Button,
  Chip,
  Day,
  DayWeather,
  Disc,
  Empty,
  Icon,
  Leg,
  List,
  ListItem,
  PageHeader,
  Section,
  SegmentTab,
  Segments,
  SkeletonRow,
  StatusRow,
} from 'components';

import { chipTone } from '../../shared/chip-tones';

const DAY_WEATHER: readonly DayWeather[] = ['sun', 'cloud', 'rain', 'snow'];
const SKELETON = [0, 1, 2, 3] as const;
const DAYS: readonly WeekendDay[] = ['Saturday', 'Sunday'];

function panelId(day: WeekendDay): string {
  return `${day === 'Saturday' ? 'sat' : 'sun'}-panel`;
}

type Busy = 'weekend' | WeekendDay | null;

/**
 * Family weekend (A9) — `docs/mocks/pages/admin.family.html`: one family's
 * upcoming weekend as the family sees it, with Saturday / Sunday tabs, the
 * "Plan this weekend" empty state and the family's past weekends (L2-159).
 */
@Component({
  selector: 'sd-admin-family-weekend',
  standalone: true,
  imports: [
    Banner,
    Block,
    Button,
    Chip,
    Day,
    Disc,
    Empty,
    Icon,
    Leg,
    List,
    ListItem,
    PageHeader,
    Section,
    Segments,
    SkeletonRow,
    StatusRow,
  ],
  templateUrl: './family-weekend.page.html',
  styleUrl: './family-weekend.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyWeekendPage {
  private readonly families = inject(ADMIN_FAMILIES_SERVICE);
  private readonly route = inject(ActivatedRoute);

  protected readonly familyId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: this.route.snapshot.paramMap.get('id') ?? '',
  });

  protected readonly header = signal<FamilyHeaderView | null>(null);
  protected readonly weekend = this.families.weekend();
  protected readonly past = signal<readonly PastWeekendRow[] | null>(null);
  protected readonly busy = signal<Busy>(null);
  protected readonly error = signal('');
  protected readonly notFound = signal(false);
  protected readonly chipTone = chipTone;
  protected readonly skeleton = SKELETON;
  protected readonly panelId = panelId;

  protected readonly selectedDay = signal<WeekendDay>('Saturday');
  protected readonly dayTabs: readonly SegmentTab[] = DAYS.map((day) => ({
    label: day,
    panel: panelId(day),
  }));

  protected readonly status = computed(() => {
    if (this.notFound()) return 'notFound';
    if (this.busy() === 'weekend') return 'generating';
    return this.weekend().status;
  });
  protected readonly title = computed(() => this.header()?.name ?? 'Family');
  protected readonly subtitle = computed(() => this.header()?.meta ?? '');
  protected readonly emptyTitle = computed(() => `Nothing is drafted for ${this.title()} yet`);

  constructor() {
    void this.load();
  }

  protected dayWeather(day: DayView): DayWeather | null {
    const icon = day.weather.icon as DayWeather;
    return DAY_WEATHER.includes(icon) ? icon : 'cloud';
  }

  protected selectDay(label: string | null): void {
    const day = DAYS.find((d) => d === label);
    if (day) this.selectedDay.set(day);
  }

  protected plan(): Promise<void> {
    return this.run(async () => {
      this.busy.set('weekend');
      try {
        await this.families.plan(this.familyId());
        await this.reloadPast();
      } finally {
        this.busy.set(null);
      }
    });
  }

  private async load(): Promise<void> {
    const id = this.familyId();
    await this.run(async () => {
      try {
        this.header.set(await this.families.family(id));
      } catch (err) {
        if (isNotFound(err)) {
          this.notFound.set(true);
          return;
        }
        throw err;
      }
      await Promise.all([this.families.loadWeekend(id), this.reloadPast()]);
    });
  }

  private async reloadPast(): Promise<void> {
    this.past.set(await this.families.history(this.familyId()));
  }

  protected async run(work: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set('Something went wrong. Try again in a moment.');
      console.error('FamilyWeekendPage action failed', err);
    }
  }
}

function isNotFound(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { status?: number }).status === 404;
}
