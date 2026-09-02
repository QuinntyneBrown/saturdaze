import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * A row of `sd-filter-chip`s. With `scroll` (the default) it is a full-bleed
 * horizontal scroller on phones and wraps from 720px, like the mocks'
 * `.scroller-x`; `scroll="false"` always wraps (`.filters`). Project
 * `<span class="sd-vdivider">` between chip groups.
 */
@Component({
  selector: 'sd-filters',
  standalone: true,
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[class.scroller-x]': 'scroll()',
    '[class.filters]': '!scroll()',
    '[attr.scroll]': 'scroll() ? "" : null',
  },
})
export class Filters {
  readonly label = input<string>('Filters');
  readonly scroll = input(true, { transform: booleanAttribute });
}
