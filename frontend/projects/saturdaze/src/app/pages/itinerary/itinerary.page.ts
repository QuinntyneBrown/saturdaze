import { Dialog } from '@angular/cdk/dialog';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { WEEKEND_PLAN_SERVICE, type Block, type WeekendDay } from 'api';
import {
  BottomNav,
  Button,
  Chip,
  Icon,
  IconButton,
  Section,
  SplitView,
  TagGroup,
  TimelineBlock,
  TopBar,
} from 'components';
import {
  ProductActionDialog,
  ProductActionDialogData,
  ProductActionDialogResult,
} from '../../dialogs/product-action-dialog/product-action-dialog';
import { applyBlockAction, mapsSearchUrl, openBlockActions } from '../../shared/block-actions';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [
    BottomNav,
    Button,
    Chip,
    Icon,
    IconButton,
    NgTemplateOutlet,
    Section,
    SplitView,
    TagGroup,
    TimelineBlock,
    TopBar,
  ],
  templateUrl: './itinerary.page.html',
  styleUrl: './itinerary.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItineraryPage {
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly itinerary = this.weekend.getItinerary();
  protected readonly activeDay = computed(() => this.itinerary().day as WeekendDay);
  protected readonly dayLocked = computed(() => {
    const blocks = this.itinerary().blocks;
    return blocks.length > 0 && blocks.every((b) => b.locked);
  });

  constructor() {
    effect(() => {
      this.weekend.setActiveDay(this.dayFromQuery(this.queryParams().get('day')));
    });
  }

  protected selectDay(event: MouseEvent, key: string): void {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { day: key },
      queryParamsHandling: 'merge',
    });
  }

  protected async regenerateDay(): Promise<void> {
    const result = await this.openDialog({
      kind: 'regenerate-day',
      day: this.activeDay(),
    });
    if (result === 'confirm') await this.weekend.regenerateDay(this.activeDay());
  }

  protected async openMore(): Promise<void> {
    await this.openDialog({ kind: 'itinerary-more', day: this.activeDay() });
  }

  protected async lockDay(): Promise<void> {
    const nextLocked = !this.dayLocked();
    await this.weekend.lockDay(this.activeDay(), nextLocked);
  }

  protected async openBlock(block: Block): Promise<void> {
    const result = await openBlockActions(this.dialog, block);
    await applyBlockAction(this.weekend, block, result);
  }

  /** The day's stops on a map; confirm opens the first activity in Google Maps. */
  protected async seeMap(): Promise<void> {
    const blocks = this.itinerary().blocks;
    const result = await this.openDialog({ kind: 'map', day: this.activeDay(), blocks });
    if (result !== 'confirm') return;
    const target = blocks.find((b) => b.kind === 'Activity') ?? blocks.find((b) => b.kind === 'Meal');
    if (!target) return;
    window.open(mapsSearchUrl(target.title), '_blank', 'noopener');
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

  private dayFromQuery(value: string | null): WeekendDay {
    return value?.toLowerCase() === 'sunday' ? 'Sunday' : 'Saturday';
  }
}
