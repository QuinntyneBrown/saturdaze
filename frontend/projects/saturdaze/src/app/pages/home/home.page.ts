import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { WEEKEND_PLAN_SERVICE, type Block } from 'api';
import {
  Anticipate,
  BottomNav,
  Button,
  Chip,
  DayCard,
  Hero,
  Icon,
  IconButton,
  ListItem,
  Section,
  SplitView,
  TimelineBlock,
  TopBar,
  WeatherDay,
  WeatherStrip,
} from 'components';
import {
  ProductActionDialog,
  ProductActionDialogData,
  ProductActionDialogResult,
} from '../../dialogs/product-action-dialog/product-action-dialog';

/**
 * Home — "This Weekend".
 *
 * Composes the master + detail panes from the weekend overview signal. The
 * detail pane is shown by the split-view on desktop only; the same data
 * fuels both, mirroring `docs/mocks/pages/home.html`.
 */

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Anticipate,
    BottomNav,
    Button,
    Chip,
    DayCard,
    Hero,
    Icon,
    IconButton,
    ListItem,
    Section,
    SplitView,
    TimelineBlock,
    TopBar,
    WeatherDay,
    WeatherStrip,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);

  protected readonly overview = this.weekend.getOverview();
  protected readonly generating = signal(false);
  protected readonly lockMode = signal(false);

  protected async planWeekend(): Promise<void> {
    if (this.generating()) return;
    this.generating.set(true);
    try {
      await this.weekend.plan(nextSaturdayIso());
    } finally {
      this.generating.set(false);
    }
  }

  protected openCalendar(): void {
    void this.openDialog({
      kind: 'calendar',
      calendarLinks: this.weekend.calendarLinks(),
    });
  }

  protected async openShare(): Promise<void> {
    const shareUrl = await this.weekend.createShareLink();
    const days = this.overview().days;
    const saturdayHighlight = days.find((d) => d.day === 'Saturday')?.highlight;
    const sundayHighlight = days.find((d) => d.day === 'Sunday')?.highlight;
    await this.openDialog({
      kind: 'share',
      shareUrl,
      saturdayHighlight,
      sundayHighlight,
    });
  }

  protected async regenerateWeekend(): Promise<void> {
    const result = await this.openDialog({ kind: 'regenerate-weekend' });
    if (result === 'confirm') await this.weekend.regenerate();
  }

  protected async regenerateDay(): Promise<void> {
    const result = await this.openDialog({ kind: 'regenerate-day', day: 'Saturday' });
    if (result === 'confirm') await this.weekend.regenerateDay('Saturday');
  }

  protected startLockMode(): void {
    this.lockMode.set(true);
  }

  protected finishLockMode(): void {
    this.lockMode.set(false);
  }

  protected async toggleLock(block: Block): Promise<void> {
    if (!block.id) return;
    await this.weekend.lockBlock(block.id, !(block.locked ?? false));
  }

  protected openItineraryDay(day: 'Saturday' | 'Sunday' = 'Saturday'): void {
    void this.router.navigate(['/itinerary'], {
      queryParams: { day: day.toLowerCase() },
    });
  }

  protected handleQuickAction(title: string): void {
    if (title.startsWith('Regenerate')) {
      void this.regenerateWeekend();
      return;
    }
    if (title.startsWith('Lock')) {
      this.startLockMode();
      return;
    }
    if (title.startsWith('Share')) {
      void this.openShare();
    }
  }

  private async openDialog(
    data: ProductActionDialogData,
  ): Promise<ProductActionDialogResult | undefined> {
    const ref = this.dialog.open<ProductActionDialogResult, ProductActionDialogData>(
      ProductActionDialog,
      { data, autoFocus: 'first-tabbable', restoreFocus: true },
    );
    return await firstValueFrom(ref.closed);
  }
}

function nextSaturdayIso(): string {
  const d = new Date();
  const daysUntilSaturday = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
