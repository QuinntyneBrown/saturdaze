import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ACTIVITY_SERVICE, ActivityCard as ActivityCardView } from 'api';
import { ActivityCard, Chip, FilterChip, Filters, Icon, Section, StatusRow } from 'components';

import { openAddToDay } from '../../shared/add-to-day';
import { chipTone, filterTone } from '../../shared/chip-tones';

/**
 * Ideas · Activities — `docs/mocks-v2/pages/ideas.html`: filter chips, then
 * "Right for this weekend's weather", "If the weather turns" and "Try
 * something new". Cards lead with the place's photo (L2-106), link out to a
 * map, and offer "Add to day" (D27, L2-107).
 */
@Component({
  selector: 'app-ideas-activities',
  standalone: true,
  imports: [ActivityCard, Chip, FilterChip, Filters, Icon, Section, StatusRow],
  templateUrl: './ideas-activities.page.html',
  styleUrl: './ideas-activities.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeasActivitiesPage {
  private readonly service = inject(ACTIVITY_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly view = this.service.list();
  protected readonly chipTone = chipTone;
  protected readonly filterTone = filterTone;

  constructor() {
    void this.service.load();
  }

  protected setFilter(label: string): void {
    this.service.setFilter(label);
  }

  protected addToDay(activity: ActivityCardView): Promise<unknown> {
    return openAddToDay(this.dialog, {
      ideaKind: 'activity',
      ideaId: activity.id,
      title: activity.title,
    });
  }
}
