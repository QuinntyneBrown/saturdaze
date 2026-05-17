import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { WEEKEND_PLAN_SERVICE } from 'api';
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

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [
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
  protected readonly activeDay = computed(() => this.itinerary().day as 'Saturday' | 'Sunday');
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

  protected async seeMap(): Promise<void> {
    const result = await this.openDialog({ kind: 'map', day: this.activeDay() });
    if (result === 'confirm') {
      window.open('https://www.google.com/maps/dir/?api=1', '_blank', 'noopener');
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

  private dayFromQuery(value: string | null): 'Saturday' | 'Sunday' {
    return value?.toLowerCase() === 'sunday' ? 'Sunday' : 'Saturday';
  }
}
