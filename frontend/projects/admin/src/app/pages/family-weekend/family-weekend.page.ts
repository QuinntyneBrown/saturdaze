import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';

import {
  ADMIN_FAMILIES_SERVICE,
  BlockRow,
  DayView,
  FamilyHeaderView,
  PastWeekendRow,
  WeekendChangeRow,
  WeekendDay,
} from 'api';
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

import {
  BlockDetailsDialog,
  BlockDetailsDialogData,
  BlockDetailsDialogResult,
} from '../../dialogs/block-details-dialog/block-details-dialog';
import { confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
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
 * "Plan this weekend" empty state and the family's past weekends (L2-159);
 * the family's own controls on every day and block (Regenerate via AD7,
 * Lock day, Why this via AD8, Swap, Lock; L2-160); and every administrator
 * change in the Changes section (L2-161).
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
  private readonly dialog = inject(Dialog);

  protected readonly familyId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: this.route.snapshot.paramMap.get('id') ?? '',
  });

  protected readonly header = signal<FamilyHeaderView | null>(null);
  protected readonly weekend = this.families.weekend();
  protected readonly past = signal<readonly PastWeekendRow[] | null>(null);
  protected readonly changes = signal<readonly WeekendChangeRow[] | null>(null);
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
  protected readonly actionsEnabled = computed(() => this.status() === 'ready' && !this.busy());

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

  protected whyLabel(block: BlockRow): string {
    return block.commitment ? `About ${block.title}` : `Why this: ${block.title}`;
  }

  protected plan(): Promise<void> {
    return this.run(async () => {
      this.busy.set('weekend');
      try {
        await this.families.plan(this.familyId());
        await Promise.all([this.reloadPast(), this.reloadChanges()]);
      } finally {
        this.busy.set(null);
      }
    });
  }

  // ---- weekend and days ----------------------------------------------

  protected async regenerateWeekend(): Promise<void> {
    const keeping = this.weekend()
      .days.flatMap((d) => d.keeping)
      .join(' · ');
    const ok = await confirmWith(this.dialog, {
      title: `Regenerate ${this.possessive()} weekend?`,
      body: 'The family sees the new plan at once. Locked blocks and commitments stay where they are.',
      well: {
        icon: 'lock',
        tone: 'accent',
        title: 'Keeping',
        body: keeping || 'Nothing is locked yet, so both days start fresh.',
      },
      confirmLabel: 'Regenerate',
      icon: 'refresh',
    });
    if (!ok) return;
    await this.change(async () => {
      this.busy.set('weekend');
      try {
        await this.families.regenerate(this.familyId());
      } finally {
        this.busy.set(null);
      }
    });
  }

  protected async regenerateDay(day: DayView): Promise<void> {
    const other = day.day === 'Saturday' ? 'Sunday' : 'Saturday';
    const ok = await confirmWith(this.dialog, {
      title: `Regenerate ${day.day}?`,
      body: `${other} will not change. The family sees the new plan at once.`,
      well: {
        icon: 'lock',
        tone: 'accent',
        title: `Keeping on ${day.day}`,
        body: day.keeping.join(' · ') || `Nothing is locked on ${day.day}, so it starts fresh.`,
      },
      confirmLabel: `Regenerate ${day.day}`,
      icon: 'refresh',
    });
    if (!ok) return;
    await this.change(async () => {
      this.busy.set(day.day);
      try {
        await this.families.regenerateDay(this.familyId(), day.day);
      } finally {
        this.busy.set(null);
      }
    });
  }

  protected lockDay(day: DayView, locked: boolean): Promise<void> {
    return this.change(() => this.families.lockDay(this.familyId(), day.day, locked));
  }

  // ---- blocks ---------------------------------------------------------

  protected blockDetails(block: BlockRow): Promise<void> {
    return this.run(async () => {
      const ref = this.dialog.open<BlockDetailsDialogResult, BlockDetailsDialogData>(
        BlockDetailsDialog,
        { ...DIALOG_OPTIONS, data: { familyName: this.title(), block } },
      );
      const result = await firstValueFrom(ref.closed);
      if (!result) return;
      if (result.kind === 'swap')
        await this.change(() => this.families.swapBlock(this.familyId(), block.id));
      else
        await this.change(() => this.families.lockBlock(this.familyId(), block.id, result.locked));
    });
  }

  protected swapBlock(block: BlockRow): Promise<void> {
    return this.change(() => this.families.swapBlock(this.familyId(), block.id));
  }

  protected lockBlock(block: BlockRow): Promise<void> {
    return this.change(() => this.families.lockBlock(this.familyId(), block.id, !block.locked));
  }

  /** "the Browns'" / "Family's": the family's name in the possessive, for AD7's question. */
  private possessive(): string {
    const name = this.title();
    return name.endsWith('s') ? `${name}'` : `${name}'s`;
  }

  /** Runs one administrator change, then refreshes the Changes section (L2-161 AC4). */
  private change(work: () => Promise<void>): Promise<void> {
    return this.run(async () => {
      await work();
      await this.reloadChanges();
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
      await Promise.all([this.families.loadWeekend(id), this.reloadPast(), this.reloadChanges()]);
    });
  }

  private async reloadPast(): Promise<void> {
    this.past.set(await this.families.history(this.familyId()));
  }

  private async reloadChanges(): Promise<void> {
    this.changes.set(await this.families.changes(this.familyId()));
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
