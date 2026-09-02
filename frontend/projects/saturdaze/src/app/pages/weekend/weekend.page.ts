import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  BlockRow,
  DayView,
  FAMILY_SERVICE,
  WEEKEND_PLAN_SERVICE,
  WeekendDay,
  upcomingSaturdayIso,
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
  GhostRow,
  Icon,
  List,
  ListItem,
  PageHeader,
  Section,
  SkeletonRow,
  StatusRow,
} from 'components';

import { AddErrandDialog, AddErrandDialogResult } from '../../dialogs/add-errand-dialog/add-errand-dialog';
import { CalendarDialog, CalendarDialogData } from '../../dialogs/calendar-dialog/calendar-dialog';
import { DIALOG_OPTIONS, confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import { ErrandAddedDialog, ErrandAddedDialogData } from '../../dialogs/errand-added-dialog/errand-added-dialog';
import { ShareDialog, ShareDialogData } from '../../dialogs/share-dialog/share-dialog';
import { MenuOpener } from '../../shell/menu-opener';
import { applyBlockAction, openBlockDialog } from '../../shared/block-actions';
import { chipTone } from '../../shared/chip-tones';
import { devState } from '../../shared/dev-state';

type Busy = 'weekend' | WeekendDay | null;
type ViewStatus = 'loading' | 'generating' | 'empty' | 'ready';

const DAY_WEATHER: readonly DayWeather[] = ['sun', 'cloud', 'rain', 'snow'];
const SKELETON = [0, 1, 2, 3] as const;
const DAYS: readonly WeekendDay[] = ['Saturday', 'Sunday'];

/**
 * Weekend — `docs/mocks-v2/pages/weekend.html`. Both days side by side
 * from 720px, stacked below; every block row carries Why / Swap / Lock,
 * every day carries Regenerate / Lock day, and "Add an errand" sits under
 * each list. The loading, generating and empty states are app-only.
 */
@Component({
  selector: 'app-weekend',
  standalone: true,
  imports: [
    Banner,
    Block,
    Button,
    Chip,
    Day,
    Disc,
    Empty,
    GhostRow,
    Icon,
    List,
    ListItem,
    PageHeader,
    Section,
    SkeletonRow,
    StatusRow,
  ],
  templateUrl: './weekend.page.html',
  styleUrl: './weekend.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekendPage {
  private readonly weekendService = inject(WEEKEND_PLAN_SERVICE);
  private readonly familyService = inject(FAMILY_SERVICE);
  private readonly dialog = inject(Dialog);
  private readonly menu = inject(MenuOpener);
  private readonly route = inject(ActivatedRoute);

  private readonly dev = devState(this.route);

  protected readonly weekend = this.weekendService.getWeekend();
  protected readonly family = this.familyService.getFamily();
  protected readonly busy = signal<Busy>(null);
  protected readonly error = signal('');
  protected readonly days = DAYS;
  protected readonly skeleton = SKELETON;
  protected readonly chipTone = chipTone;

  protected readonly status = computed<ViewStatus>(() => {
    if (this.dev === 'empty') return 'empty';
    if (this.dev === 'generating' || this.busy() === 'weekend') return 'generating';
    return this.weekend().status;
  });

  protected readonly headline = computed(() =>
    this.status() === 'empty' ? 'Your first weekend' : 'This weekend',
  );
  protected readonly subtitle = computed(() => {
    switch (this.status()) {
      case 'empty':
        return 'Nothing is drafted yet. Planning takes a few seconds.';
      case 'generating':
        return 'Sketching Saturday and Sunday. Usually four to six seconds.';
      case 'loading':
        return 'Opening this weekend.';
      default:
        return this.weekend().subtitle;
    }
  });
  protected readonly emptyTitle = computed(() => {
    const name = this.family().headline;
    return name && this.family().status === 'ready'
      ? `Saturday and Sunday, drafted around ${name}`
      : 'Saturday and Sunday, drafted around your family';
  });
  protected readonly actionsEnabled = computed(() => this.status() === 'ready' && !this.busy());

  constructor() {
    if (this.dev === 'generating') return;
    void this.run(async () => {
      await this.weekendService.loadCurrent();
      if (this.weekend().status === 'empty' || this.dev === 'empty') {
        await this.familyService.load();
      }
    });
  }

  protected dayWeather(day: DayView): DayWeather | null {
    const icon = day.weather.icon as DayWeather;
    return DAY_WEATHER.includes(icon) ? icon : 'cloud';
  }

  protected whyLabel(block: BlockRow): string {
    return block.commitment ? `About ${block.title}` : `Why this: ${block.title}`;
  }

  // ---- header ---------------------------------------------------------

  protected plan(): Promise<void> {
    return this.run(async () => {
      this.busy.set('weekend');
      try {
        await this.weekendService.plan(upcomingSaturdayIso());
      } finally {
        this.busy.set(null);
      }
    });
  }

  protected share(): Promise<void> {
    return this.run(async () => {
      const shareUrl = await this.weekendService.createShareLink();
      this.dialog.open<void, ShareDialogData>(ShareDialog, { ...DIALOG_OPTIONS, data: { shareUrl } });
    });
  }

  protected calendar(): void {
    const calendar = this.weekendService.calendarExport();
    this.dialog.open<void, CalendarDialogData>(CalendarDialog, {
      ...DIALOG_OPTIONS,
      data: { calendar },
    });
  }

  protected async more(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const anchor = target.closest<HTMLElement>('button') ?? target;
    const choice = await this.menu.open(anchor, {
      title: 'Weekend options',
      items: [
        {
          id: 'regenerate',
          label: 'Regenerate the weekend',
          icon: 'refresh',
          sub: 'Locked blocks stay where they are',
        },
        { id: 'calendar', label: 'Add to calendar', icon: 'calendar', sub: 'One .ics with both days' },
      ],
    });
    if (choice?.id === 'regenerate') await this.regenerateWeekend();
    if (choice?.id === 'calendar') this.calendar();
  }

  protected async regenerateWeekend(): Promise<void> {
    const keeping = this.weekend()
      .days.flatMap((d) => d.keeping)
      .join(' · ');
    const ok = await confirmWith(this.dialog, {
      title: 'Regenerate the weekend?',
      body: 'Locked blocks stay where they are.',
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
    await this.run(async () => {
      this.busy.set('weekend');
      try {
        await this.weekendService.regenerate();
      } finally {
        this.busy.set(null);
      }
    });
  }

  // ---- days -----------------------------------------------------------

  protected async regenerateDay(day: DayView): Promise<void> {
    const other = day.day === 'Saturday' ? 'Sunday' : 'Saturday';
    const ok = await confirmWith(this.dialog, {
      title: `Regenerate ${day.day}?`,
      body: `${other} will not change.`,
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
    await this.run(async () => {
      this.busy.set(day.day);
      try {
        await this.weekendService.regenerateDay(day.day);
      } finally {
        this.busy.set(null);
      }
    });
  }

  protected lockDay(day: DayView, locked: boolean): Promise<void> {
    return this.run(() => this.weekendService.lockDay(day.day, locked));
  }

  // ---- blocks ---------------------------------------------------------

  protected blockDetails(block: BlockRow): Promise<void> {
    return this.run(async () => {
      const result = await openBlockDialog(this.dialog, block);
      await applyBlockAction(this.weekendService, block, result);
    });
  }

  protected swapBlock(block: BlockRow): Promise<void> {
    return this.run(() => applyBlockAction(this.weekendService, block, { kind: 'swap' }));
  }

  protected lockBlock(block: BlockRow): Promise<void> {
    return this.run(() =>
      applyBlockAction(this.weekendService, block, { kind: 'lock', locked: !block.locked }),
    );
  }

  protected toggleDone(block: BlockRow): Promise<void> {
    return this.run(() =>
      applyBlockAction(this.weekendService, block, { kind: 'done', done: !block.done }),
    );
  }

  protected addErrand(): Promise<void> {
    return this.run(async () => {
      const ref = this.dialog.open<AddErrandDialogResult>(AddErrandDialog, DIALOG_OPTIONS);
      const placement = await firstValueFrom(ref.closed);
      if (!placement) return;
      this.dialog.open<void, ErrandAddedDialogData>(ErrandAddedDialog, {
        ...DIALOG_OPTIONS,
        data: { placement },
      });
    });
  }

  // ---- errors ---------------------------------------------------------

  private async run(work: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set('Something did not go through. Try again in a moment.');
      console.error('WeekendPage action failed', err);
    }
  }
}
