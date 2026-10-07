import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Chip, ChipTone } from '../chip/chip';
import { Icon } from '../icon/icon';
import { ListItem } from '../list-item/list-item';
import { CardMedia, Media, MediaTone } from '../media/media';

/** A health chip on a place row: "No photo", "Blocked URL", "Unreviewed", "Missing alt text", "Healthy". */
export interface PlaceRowFlag {
  readonly tone: ChipTone;
  readonly icon?: string;
  readonly label: string;
}

/**
 * One catalog place in an admin list (L2-112, L2-113): the primary photo as
 * a 4:3 thumbnail (or the fallback tile), the name, a meta line and the
 * health chips, linking to the place's photos. Mirrors `.place-row` in
 * docs/mocks/pages/admin.places.html. Use it inside `sd-list card`, one per
 * place; the host is the row, wrapping an `sd-list-item`.
 */
@Component({
  selector: 'sd-place-row',
  standalone: true,
  imports: [Chip, Icon, ListItem, Media],
  templateUrl: './place-row.html',
  styleUrl: './place-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'place-row',
    // The list item inside is the `listitem`; the wrapper adds no semantics.
    role: 'none',
  },
})
export class PlaceRow {
  readonly rowTitle = input<string>('', { alias: 'title' });
  /** "Activity · 3 photos". */
  readonly subtitle = input<string>('');
  /** The place's photos screen. */
  readonly href = input<string>('');
  readonly photo = input<CardMedia | null>(null);
  /** The fallback tile's tone and icon when there is no photo. */
  readonly tone = input<MediaTone>('sky');
  readonly icon = input<string>('sparkle');
  /** Health chips, worst first. */
  readonly flags = input<readonly PlaceRowFlag[]>([]);
}
