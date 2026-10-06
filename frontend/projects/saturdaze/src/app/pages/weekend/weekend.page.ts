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
  Cover,
  Day,
  DayWeather,
  Disc,
  Empty,
  GhostRow,
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
  AddErrandDialog,
  AddErrandDialogResult,
} from '../../dialogs/add-errand-dialog/add-errand-dialog';
import { CalendarDialog, CalendarDialogData } from '../../dialogs/calendar-dialog/calendar-dialog';
import {
  CoverPhotoDialog,
  CoverPhotoDialogData,
  CoverPhotoDialogResult,
} from '../../dialogs/cover-photo-dialog/cover-photo-dialog';
import {
  DayMapDialog,
  DayMapDialogData,
  DayMapDialogResult,
} from '../../dialogs/day-map-dialog/day-map-dialog';
import { DIALOG_OPTIONS, confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import {
  ErrandAddedDialog,
  ErrandAddedDialogData,
} from '../../dialogs/errand-added-dialog/errand-added-dialog';
import { ShareDialog, ShareDialogData } from '../../dialogs/share-dialog/share-dialog';
import { MenuOpener } from '../../shell/menu-opener';
import { applyBlockAction, openBlockDialog } from '../../shared/block-actions';
import { chipTone } from '../../shared/chip-tones';
import { devState } from '../../shared/dev-state';

import { DayMap } from './day-map/day-map';

type Busy = 'weekend' | WeekendDay | null;
type ViewStatus = 'loading' | 'generating' | 'empty' | 'ready';

const DAY_WEATHER: readonly DayWeather[] = ['sun', 'cloud', 'rain', 'snow'];
const SKELETON = [0, 1, 2, 3] as const;
const DAYS: readonly WeekendDay[] = ['Saturday', 'Sunday'];

/**
 * Weekend — `docs/mocks/pages/weekend.html`. Saturday / Sunday tabs show one
 * day at a time beside its map (stacked under 1024px, L2-105): numbered stops,
 * travel legs between places (L2-102, L2-103), and a map kept in step with the
 * timeline (L2-104). Every block row carries Why / Swap / Lock, every day
 * Regenerate / Lock day, and "Add an errand" sits under the list. The loading,
 * generating and empty states are app-only.
 */
@Component({
  selector: 'app-weekend',
  standalone: true,
  imports: [
    Banner,
    Block,
    Button,
    Chip,
    Cover,
    Day,
    Disc,
    Empty,
    GhostRow,
    DayMap,
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

  /** The day on screen (L2-104 AC4); Saturday when the screen opens (L2-105 AC5). */
  protected readonly selectedDay = signal<WeekendDay>('Saturday');
  /** The stop highlighted in both the timeline and the map (L2-104). */
  protected readonly activeStop = signal<number | null>(null);
  /** The stop a pin last brought into focus; hover falls back to it. */
  private focusedStop: number | null = null;
  protected readonly dayTabs: readonly SegmentTab[] = DAYS.map((day) => ({
    label: day,
    panel: panelId(day),
  }));
  protected readonly panelId = panelId;

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
      this.dialog.open<void, ShareDialogData>(ShareDialog, {
        ...DIALOG_OPTIONS,
        data: { shareUrl },
      });
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
        {
          id: 'calendar',
          label: 'Add to calendar',
          icon: 'calendar',
          sub: 'One .ics with both days',
        },
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

  /**
   * "Change photo" → D29; the chosen stop's photo becomes the cover (L2-108
   * AC2). A family photo is uploaded by the dialog itself (L2-109).
   */
  protected async changeCover(): Promise<void> {
    const view = this.weekend();
    const ref = this.dialog.open<CoverPhotoDialogResult, CoverPhotoDialogData>(CoverPhotoDialog, {
      ...DIALOG_OPTIONS,
      data: {
        choices: view.coverChoices,
        currentPlaceId: view.cover?.placeId ?? null,
        upload: (file) => this.weekendService.uploadCover(file),
      },
    });
    const selection = await firstValueFrom(ref.closed);
    if (!selection || selection.source === 'uploaded') return;
    await this.run(() => this.weekendService.setCover(selection));
  }

  protected selectDay(label: string | null): void {
    const day = DAYS.find((d) => d === label);
    if (!day) return;
    this.selectedDay.set(day);
    this.activeStop.set(null);
  }

  protected stopId(day: WeekendDay, n: number): string {
    return `stop-${day.toLowerCase()}-${n}`;
  }

  /** Pointer or focus on a stop row highlights its pin (L2-104 AC1, AC2). */
  protected hoverStop(block: BlockRow, on: boolean): void {
    const n = block.stopNumber;
    if (n === null) return;
    if (on) {
      this.activeStop.set(n);
      return;
    }
    if (this.focusedStop === n && !this.stopHasFocus(block)) this.focusedStop = null;
    if (this.activeStop() === n) this.activeStop.set(this.focusedStop);
  }

  protected hoverPin(n: number | null): void {
    this.activeStop.set(n ?? this.focusedStop);
  }

  private stopHasFocus(block: BlockRow): boolean {
    const el = document.getElementById(this.stopId(block.day, block.stopNumber ?? 0));
    return !!el && el.contains(document.activeElement);
  }

  /**
   * A pin was activated: highlight, scroll to and focus its stop (L2-104 AC3),
   * without animation when the user prefers reduced motion (AC6).
   */
  protected focusStop(day: WeekendDay, n: number): void {
    this.activeStop.set(n);
    this.focusedStop = n;
    const el = document.getElementById(this.stopId(day, n));
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  }

  protected async openMap(day: DayView): Promise<void> {
    const ref = this.dialog.open<DayMapDialogResult, DayMapDialogData>(DayMapDialog, {
      ...DIALOG_OPTIONS,
      data: { day },
    });
    const n = await firstValueFrom(ref.closed);
    if (n) this.focusStop(day.day, n);
  }
}

function panelId(day: WeekendDay): string {
  return `${day.toLowerCase()}-panel`;
}
