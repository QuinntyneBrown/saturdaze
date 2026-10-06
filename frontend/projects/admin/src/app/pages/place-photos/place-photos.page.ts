import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { ADMIN_PLACES_SERVICE, PlacePhotosView } from 'api';
import {
  Banner,
  Empty,
  PageHeader,
  PhotoTile,
  PhotoTileBadge,
  Section,
  SlotPreview,
  StatusRow,
} from 'components';

import { chipTone } from '../../shared/chip-tones';

type Status = 'loading' | 'ready' | 'missing';

/**
 * Place photos (A4) — `docs/mocks/pages/admin.place.html`: one place, its
 * primary photo in every family-app slot, and every photo as a tile with
 * its source, review state and health badges (L2-114). Actions on the
 * tiles and in the header arrive with the slices that add them.
 */
@Component({
  selector: 'sd-admin-place-photos',
  standalone: true,
  imports: [Banner, Empty, PageHeader, PhotoTile, Section, SlotPreview, StatusRow],
  templateUrl: './place-photos.page.html',
  styleUrl: './place-photos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacePhotosPage {
  private readonly places = inject(ADMIN_PLACES_SERVICE);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(
    this.route.paramMap.pipe(map((p) => ({ kind: p.get('kind') ?? '', id: p.get('id') ?? '' }))),
    { initialValue: { kind: '', id: '' } },
  );

  protected readonly status = signal<Status>('loading');
  protected readonly view = signal<PlacePhotosView | null>(null);
  protected readonly error = signal('');

  protected readonly title = computed(() => this.view()?.name ?? '');
  protected readonly subtitle = computed(() => this.view()?.subtitle ?? '');

  constructor() {
    effect(() => {
      const { kind, id } = this.params();
      if (kind && id) void this.load(kind, id);
    });
  }

  protected badges(tile: PlacePhotosView['tiles'][number]): PhotoTileBadge[] {
    return tile.badges.map((b) => ({ tone: chipTone(b.tone), icon: b.icon, label: b.label }));
  }

  private async load(kind: string, id: string): Promise<void> {
    this.status.set('loading');
    this.error.set('');
    try {
      this.view.set(await this.places.photos(kind, id));
      this.status.set('ready');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404 || status === 400) {
        this.status.set('missing');
        return;
      }
      this.status.set('ready');
      this.error.set('Could not load this place. Try again in a moment.');
      console.error('PlacePhotosPage load failed', err);
    }
  }
}
