import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { CardMedia, Media, MediaTone } from '../media/media';

/**
 * One choice in an `sd-photo-pick`: a 4:3 radio tile. Mirrors
 * `.photo-pick__opt` in docs/mocks/styles/app.css. The tile shows `src` as a
 * plain cover-fit image, or `media` through `sd-media` (its fallback tile
 * when there is no photo); a `plain` tile is the dashed one that carries
 * projected content instead ("No photo"). `caption` is the name chip.
 * The radio is native, so arrow keys move through the group.
 */
@Component({
  selector: 'sd-photo-pick-option',
  standalone: true,
  imports: [Media],
  templateUrl: './photo-pick-option.html',
  styleUrl: './photo-pick-option.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoPickOption {
  /** The radio group's name, the same for every option of one pick. */
  readonly name = input.required<string>();
  readonly value = input.required<string>();
  readonly checked = input(false, { transform: booleanAttribute });
  /** The radio's accessible name. */
  readonly label = input<string>('');
  /** The name chip over the photo. */
  readonly caption = input<string>('');
  /** An image URL shown as is, cover-fit. */
  readonly src = input<string>('');
  /** A catalog photo shown through `sd-media`, with its fallback tile when null. */
  readonly media = input<CardMedia | null>(null);
  readonly tone = input<MediaTone>('indoor');
  /** A dashed tile with projected content (an icon and a word) instead of a photo. */
  readonly plain = input(false, { transform: booleanAttribute });
  /** Emits the option's value when it is picked. */
  readonly picked = output<string>();

  /** One chip per tile: the caption replaces `sd-media`'s credit chip, which would sit under it. */
  protected readonly shownMedia = computed(() => {
    const media = this.media();
    return media && this.caption() ? { ...media, credit: '' } : media;
  });
}
