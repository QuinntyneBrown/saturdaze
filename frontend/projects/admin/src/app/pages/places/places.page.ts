import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ADMIN_PLACES_SERVICE } from 'api';
import { Banner, Empty, List, ListItem, Media, PageHeader, StatusRow } from 'components';

/**
 * Places (A3) — `docs/mocks/pages/admin.places.html`: every catalog place
 * as a row with its primary photo thumbnail, kind and photo count; each row
 * opens the Place photos screen (L2-113).
 */
@Component({
  selector: 'sd-admin-places',
  standalone: true,
  imports: [Banner, Empty, List, ListItem, Media, PageHeader, StatusRow],
  templateUrl: './places.page.html',
  styleUrl: './places.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacesPage {
  private readonly places = inject(ADMIN_PLACES_SERVICE);

  protected readonly view = this.places.list();
  protected readonly error = signal('');

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.error.set('');
    try {
      await this.places.load();
    } catch (err) {
      this.error.set('Could not load the places. Try again in a moment.');
      console.error('PlacesPage load failed', err);
    }
  }
}
