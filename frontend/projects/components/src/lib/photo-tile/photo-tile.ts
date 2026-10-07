import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

import { ChipTone, Chip } from '../chip/chip';
import { DetailItem, Details } from '../details/details';
import { Icon } from '../icon/icon';
import { CardMedia, Media } from '../media/media';

/** A badge on a photo tile: Primary, Curated, Provider, Reviewed, Unreviewed, Missing alt text, Blocked URL. */
export interface PhotoTileBadge {
  readonly tone: ChipTone;
  readonly icon?: string;
  readonly label: string;
}

/**
 * One photo of a catalog place on the admin Place photos screen (L2-114).
 * Mirrors `.photo-tile` in docs/mocks/pages/admin.place.html: a 4:3 media
 * frame, the badges, the alt text / credit / licence / size details and an
 * actions row projected into `[slot=actions]`. A `blocked` photo (its URL
 * is not HTTPS on an allowed origin, so families never see it) shows the
 * "Blocked URL" tile instead of loading the image.
 */
@Component({
  selector: 'sd-photo-tile',
  standalone: true,
  imports: [Chip, Details, Icon, Media],
  templateUrl: './photo-tile.html',
  styleUrl: './photo-tile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card photo-tile',
    '[attr.primary]': 'primary() ? "" : null',
    '[attr.blocked]': 'blocked() ? "" : null',
  },
})
export class PhotoTile {
  readonly media = input<CardMedia | null>(null);
  readonly blocked = input(false, { transform: booleanAttribute });
  readonly primary = input(false, { transform: booleanAttribute });
  readonly badges = input<readonly PhotoTileBadge[]>([]);
  /** Empty alt text shows as "Not given". */
  readonly alt = input<string>('');
  readonly credit = input<string>('');
  readonly licence = input<string>('');
  /** "1200 × 675". */
  readonly size = input<string>('');

  protected readonly details = computed<DetailItem[]>(() => [
    { label: 'Alt text', value: this.alt() || null },
    { label: 'Credit', value: this.credit() },
    { label: 'Licence', value: this.licence() },
    { label: 'Size', value: this.size() },
  ]);
}
