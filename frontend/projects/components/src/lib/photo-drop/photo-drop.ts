import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

/**
 * Choose a photo file: a dashed drop zone that turns into a preview of the
 * chosen image. Mirrors `.upload-drop` (admin AD1) and, with `tile`, the
 * "Your own photo" `.photo-pick__upload` option of an `sd-photo-pick` (D29)
 * in docs/mocks/styles/app.css. The native file input covers the zone, so it
 * is one keyboard stop and opens the picker on Enter or Space. Projected
 * content is the empty state (an icon and a word); `fileChange` emits the
 * file, and the consumer validates it and passes the preview back as `src`.
 */
@Component({
  selector: 'sd-photo-drop',
  standalone: true,
  templateUrl: './photo-drop.html',
  styleUrl: './photo-drop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoDrop {
  /** The file input's accessible name ("Choose a photo"). */
  readonly label = input.required<string>();
  readonly accept = input('image/jpeg,image/png,image/webp');
  /** A preview of the chosen image (an object URL). */
  readonly src = input<string>('');
  /** The chip over the preview ("photo.jpg · 0.8 MB · 1920 × 1080"). */
  readonly caption = input<string>('');
  /** A 4:3 option inside `sd-photo-pick` rather than a full-width zone. */
  readonly tile = input(false, { transform: booleanAttribute });
  /** Draw the picked ring (a tile that is the group's current choice). */
  readonly chosen = input(false, { transform: booleanAttribute });
  readonly fileChange = output<File>();

  protected pick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.fileChange.emit(file);
  }
}
