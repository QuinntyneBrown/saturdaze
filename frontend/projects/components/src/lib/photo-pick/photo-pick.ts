import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

let nextId = 0;

/**
 * A grid of photo choices, one of which is picked: the weekend cover (D29)
 * or the next primary photo (AD5). Mirrors `.photo-pick` in
 * docs/mocks/styles/app.css: two columns, three from 576px. The grid is the
 * radio group, named by `label`; `showLabel` also prints that name above it
 * as a field label. Project `sd-photo-pick-option`s, and an
 * `sd-photo-drop tile` for "your own photo".
 */
@Component({
  selector: 'sd-photo-pick',
  standalone: true,
  templateUrl: './photo-pick.html',
  styleUrl: './photo-pick.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoPick {
  /** The group's accessible name ("Choose a cover photo", "Next primary"). */
  readonly label = input.required<string>();
  /** Show the name above the grid as a field label. */
  readonly showLabel = input(false, { transform: booleanAttribute });

  protected readonly labelId = `sd-photo-pick-${nextId++}`;
}
