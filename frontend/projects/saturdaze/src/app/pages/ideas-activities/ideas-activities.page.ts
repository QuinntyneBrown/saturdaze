import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ACTIVITY_SERVICE } from 'api';
import { ActivityCard, Chip, FilterChip, Filters, Icon, Section, StatusRow } from 'components';

import { chipTone, filterTone } from '../../shared/chip-tones';

/**
 * Ideas · Activities — `docs/mocks-v2/pages/ideas.html`: filter chips, then
 * "Right for this weekend's weather", "If the weather turns" and "Try
 * something new". Cards link out to a map; adding to a day is not an API
 * feature.
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

  protected readonly view = this.service.list();
  protected readonly chipTone = chipTone;
  protected readonly filterTone = filterTone;

  constructor() {
    void this.service.load();
  }

  protected setFilter(label: string): void {
    this.service.setFilter(label);
  }
}
