import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Five stars. Mirrors `.stars` in docs/mocks-v2/styles/app.css.
 *
 * Display mode renders filled stars up to `rating` plus an optional caption
 * ("5 of 5"). `editable` renders five `role="radio"` buttons inside a
 * radiogroup (the rating dialog); pressing the current star clears it.
 */
@Component({
  selector: 'sd-stars',
  standalone: true,
  imports: [Icon],
  templateUrl: './stars.html',
  styleUrl: './stars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'stars',
    '[class.stars--lg]': 'size() === "lg"',
    '[attr.rating]': 'rating()',
    '[attr.editable]': 'editable() ? "" : null',
    '[attr.role]': 'editable() ? "radiogroup" : null',
    '[attr.aria-label]': 'editable() ? groupLabel() : null',
  },
})
export class Stars {
  readonly rating = input<number>(0);
  /** Caption after the stars in display mode ("5 of 5", "Rate it"). */
  readonly label = input<string>('');
  readonly size = input<'md' | 'lg'>('md');
  readonly editable = input(false, { transform: booleanAttribute });
  readonly groupLabel = input<string>('Rating');
  readonly ratingChange = output<number>();

  protected readonly steps = [1, 2, 3, 4, 5];
  protected readonly iconSize = computed(() => (this.size() === 'lg' ? 24 : 18));

  protected pick(step: number): void {
    this.ratingChange.emit(step === this.rating() ? 0 : step);
  }

  protected starLabel(step: number): string {
    return step === 1 ? '1 star' : `${step} stars`;
  }
}
