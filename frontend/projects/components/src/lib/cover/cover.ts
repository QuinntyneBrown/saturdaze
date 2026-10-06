import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';
import { CardMedia, MediaTone } from '../media/media';

/**
 * The weekend cover — `.cover` in docs/mocks/pages/weekend.html (L2-108). The
 * cover photo, eagerly loaded since it is above the fold, with its label as a
 * credit chip; the date range, the page's `h1` and the summary sit on a
 * gradient scrim that keeps white text at 4.5:1 over light and dark photos.
 * With no photo it is a tinted tile and the text stays readable. Project the
 * "Change photo" control into `[slot=edit]`.
 */
@Component({
  selector: 'sd-cover',
  standalone: true,
  imports: [Icon],
  templateUrl: './cover.html',
  styleUrl: './cover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cover',
    '[class.cover--fallback]': '!media()',
  },
})
export class Cover {
  readonly media = input<CardMedia | null>(null);
  /** "16 – 17 May". */
  readonly eyebrow = input<string>('');
  readonly coverTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly tone = input<MediaTone>('sky');
}
