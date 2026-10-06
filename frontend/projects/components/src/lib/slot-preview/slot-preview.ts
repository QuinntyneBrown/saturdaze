import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Card } from '../card/card';
import { Cover } from '../cover/cover';
import { CardMedia, Media, MediaTone } from '../media/media';

/**
 * "How families see it" (L2-114): a place's primary photo in every slot the
 * family app uses, so a curator can judge it before choosing it. Mirrors
 * `.preview-grid` in docs/mocks/pages/admin.place.html: the idea card at
 * 16:9 (the same frame at 390 and 1440 px), the 4:3 thumbnails (timeline
 * stop and cover picker) and the weekend cover with its scrim and title.
 * Without a photo every slot shows its fallback.
 */
@Component({
  selector: 'sd-slot-preview',
  standalone: true,
  imports: [Card, Cover, Media],
  templateUrl: './slot-preview.html',
  styleUrl: './slot-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'preview-grid',
  },
})
export class SlotPreview {
  readonly media = input<CardMedia | null>(null);
  /** The place's name: the card title and the cover's "From {name}". */
  readonly name = input<string>('');
  /** The card's meta line, e.g. the neighbourhood. */
  readonly meta = input<string>('');
  readonly tone = input<MediaTone>('sky');
  readonly icon = input<string>('sparkle');
}
