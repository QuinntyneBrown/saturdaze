import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { CardMedia, Media } from '../media/media';
import { Stars } from '../stars/stars';

/**
 * A past weekend on the Past screen. Mirrors the `.card.card--media` in
 * docs/mocks/pages/past.html: the cover photo with its credit, or an
 * "Add a photo" control (L2-110), then the date eyebrow with the favourite heart,
 * the title as a rename button, the rating as a rate button, two-line
 * highlights, and Remix / Repeat.
 */
@Component({
  selector: 'sd-past-card',
  standalone: true,
  imports: [Button, Icon, Media, Stars],
  templateUrl: './past-card.html',
  styleUrl: './past-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card card--media',
  },
})
export class PastCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  /** "10 – 11 May 2026". */
  readonly dateRange = input<string>('');
  readonly rating = input<number | null>(null);
  readonly favourite = input(false, { transform: booleanAttribute });
  readonly highlights = input<string>('');
  /** The weekend's cover; `null` shows "Add a photo to {title}" (L2-110 AC2). */
  readonly cover = input<CardMedia | null>(null);
  readonly addPhoto = output<void>();
  readonly favouriteToggle = output<boolean>();
  readonly rename = output<void>();
  readonly rate = output<void>();
  readonly remix = output<void>();
  readonly repeat = output<void>();

  protected readonly ratingLabel = computed(() => {
    const r = this.rating();
    return r ? `${r} of 5` : 'Rate it';
  });

  protected readonly rateLabel = computed(() => {
    const r = this.rating();
    return r ? `Rate this weekend, currently ${r} of 5` : 'Rate this weekend';
  });
}
