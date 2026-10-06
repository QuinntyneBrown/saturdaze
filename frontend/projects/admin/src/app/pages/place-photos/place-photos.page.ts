import { Dialog } from '@angular/cdk/dialog';
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
import { firstValueFrom, map } from 'rxjs';

import { ADMIN_PHOTOS_SERVICE, ADMIN_PLACES_SERVICE, PhotoTileView, PlacePhotosView } from 'api';
import {
  Banner,
  Button,
  Empty,
  Icon,
  PageHeader,
  PhotoTile,
  PhotoTileBadge,
  Section,
  SlotPreview,
  StatusRow,
} from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  MakePrimaryDialog,
  MakePrimaryDialogData,
  MakePrimaryDialogResult,
} from '../../dialogs/make-primary-dialog/make-primary-dialog';
import { chipTone } from '../../shared/chip-tones';

type Status = 'loading' | 'ready' | 'missing';

/**
 * Place photos (A4) — `docs/mocks/pages/admin.place.html`: one place, its
 * primary photo in every family-app slot, and every photo as a tile with
 * its source, review state and health badges (L2-114). Make primary opens
 * AD4 with the cover impact before the change (L2-117).
 */
@Component({
  selector: 'sd-admin-place-photos',
  standalone: true,
  imports: [Banner, Button, Empty, Icon, PageHeader, PhotoTile, Section, SlotPreview, StatusRow],
  templateUrl: './place-photos.page.html',
  styleUrl: './place-photos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacePhotosPage {
  private readonly places = inject(ADMIN_PLACES_SERVICE);
  private readonly photos = inject(ADMIN_PHOTOS_SERVICE);
  private readonly dialog = inject(Dialog);
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

  /** AD4: confirm with the cover impact, then make the photo primary (L2-117). */
  protected async makePrimary(tile: PhotoTileView): Promise<void> {
    const v = this.view();
    if (!v) return;
    const ref = this.dialog.open<MakePrimaryDialogResult, MakePrimaryDialogData>(
      MakePrimaryDialog,
      {
        ...DIALOG_OPTIONS,
        data: { media: tile.media, placeName: v.name, coverImpact: v.coverImpact },
      },
    );
    if ((await firstValueFrom(ref.closed)) !== 'confirm') return;
    await this.run(async () => {
      await this.photos.makePrimary(tile.id);
    });
  }

  /** Runs a photo action, then reloads the place so tiles and previews agree. */
  private async run(work: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await work();
      this.view.set(await this.places.photos(this.params().kind, this.params().id));
    } catch (err) {
      this.error.set('That did not go through. Try again in a moment.');
      console.error('PlacePhotosPage action failed', err);
    }
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
