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

import {
  AddPhotoUrlDialog,
  AddPhotoUrlDialogData,
  AddPhotoUrlDialogResult,
} from '../../dialogs/add-photo-url-dialog/add-photo-url-dialog';
import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  EditPhotoDialog,
  EditPhotoDialogData,
  EditPhotoDialogResult,
} from '../../dialogs/edit-photo-dialog/edit-photo-dialog';
import {
  MakePrimaryDialog,
  MakePrimaryDialogData,
  MakePrimaryDialogResult,
} from '../../dialogs/make-primary-dialog/make-primary-dialog';
import {
  RemovePhotoDialog,
  RemovePhotoDialogData,
  RemovePhotoDialogResult,
} from '../../dialogs/remove-photo-dialog/remove-photo-dialog';
import {
  UploadPhotoDialog,
  UploadPhotoDialogData,
  UploadPhotoDialogResult,
} from '../../dialogs/upload-photo-dialog/upload-photo-dialog';
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

  /** AD1: upload a curated photo; the dialog sends it and shows refusals in place (L2-115). */
  protected async upload(): Promise<void> {
    const v = this.view();
    if (!v) return;
    const ref = this.dialog.open<UploadPhotoDialogResult, UploadPhotoDialogData>(
      UploadPhotoDialog,
      {
        ...DIALOG_OPTIONS,
        data: {
          placeName: v.name,
          upload: async (file, details) => {
            await this.photos.upload(v.kind, v.id, file, details);
          },
        },
      },
    );
    if ((await firstValueFrom(ref.closed)) !== 'uploaded') return;
    await this.run(async () => undefined);
  }

  /** AD2: add a curated photo by its allow-listed address (L2-116). */
  protected async addFromUrl(): Promise<void> {
    const v = this.view();
    if (!v) return;
    const ref = this.dialog.open<AddPhotoUrlDialogResult, AddPhotoUrlDialogData>(
      AddPhotoUrlDialog,
      {
        ...DIALOG_OPTIONS,
        data: {
          placeName: v.name,
          add: async (url, details) => {
            await this.photos.addFromUrl(v.kind, v.id, url, details);
          },
        },
      },
    );
    if ((await firstValueFrom(ref.closed)) !== 'added') return;
    await this.run(async () => undefined);
  }

  /** AD3: edit alt text, attribution and licence (L2-118). */
  protected async edit(tile: PhotoTileView): Promise<void> {
    const ref = this.dialog.open<EditPhotoDialogResult, EditPhotoDialogData>(EditPhotoDialog, {
      ...DIALOG_OPTIONS,
      data: { tile },
    });
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    await this.run(async () => {
      await this.photos.edit(tile.id, result);
    });
  }

  /** AD5: remove a photo; the primary needs its successor chosen first (L2-119). */
  protected async remove(tile: PhotoTileView): Promise<void> {
    const v = this.view();
    if (!v) return;
    const ref = this.dialog.open<RemovePhotoDialogResult, RemovePhotoDialogData>(
      RemovePhotoDialog,
      {
        ...DIALOG_OPTIONS,
        data: {
          tile,
          siblings: v.tiles.filter((t) => t.id !== tile.id),
          placeName: v.name,
          coverImpact: v.coverImpact,
        },
      },
    );
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    await this.run(async () => {
      await this.photos.remove(tile.id, result.nextPrimaryId);
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
