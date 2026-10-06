import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';

import { Icon } from '../icon/icon';

/** A photo for a media frame (L2-088): the primary photo of a place, ready to render. */
export interface CardMedia {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  /** Attribution shown on the image, e.g. "Photo · Jo Doe". */
  readonly credit: string;
}

export type MediaTone = 'leaf' | 'indoor' | 'sky' | 'sun';
export type MediaRatio = '16:9' | '4:3';

/**
 * A photo frame — `.media` in docs/mocks/pages/ideas.html (L2-094, L2-089).
 * Renders the image at a fixed aspect ratio with explicit width and height
 * (no layout shift), lazy-loaded unless `eager`, with its attribution as a
 * credit chip. With no photo, or when the image fails to load, it becomes the
 * tinted fallback tile with an icon: decorative, so `aria-hidden`.
 */
@Component({
  selector: 'sd-media',
  standalone: true,
  imports: [Icon],
  templateUrl: './media.html',
  styleUrl: './media.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'media',
    '[class.media--4x3]': 'ratio() === "4:3"',
    '[class.media--fallback]': 'fallback()',
    '[class.media--leaf]': 'fallback() && tone() === "leaf"',
    '[class.media--indoor]': 'fallback() && tone() === "indoor"',
    '[class.media--sky]': 'fallback() && tone() === "sky"',
    '[class.media--sun]': 'fallback() && tone() === "sun"',
    '[attr.aria-hidden]': 'fallback() ? "true" : null',
  },
})
export class Media {
  readonly photo = input<CardMedia | null>(null);
  readonly ratio = input<MediaRatio>('16:9');
  readonly tone = input<MediaTone>('sky');
  readonly icon = input<string>('sparkle');
  /** Above-the-fold images (a cover) load eagerly; cards stay lazy. */
  readonly eager = input(false, { transform: booleanAttribute });

  private readonly failedSrc = signal<string | null>(null);

  protected readonly fallback = computed(() => {
    const photo = this.photo();
    return !photo || this.failedSrc() === photo.src;
  });

  protected failed(src: string): void {
    this.failedSrc.set(src);
  }
}
