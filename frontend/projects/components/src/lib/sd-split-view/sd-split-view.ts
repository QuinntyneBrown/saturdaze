import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Master-detail layout. Mirrors `docs/mocks/components/sd-split-view.js`.
 * On mobile / tablet only the master slot renders; the detail pane becomes
 * visible on desktop (`>= 1024px`). Optional `sticky-detail` /
 * `sticky-master` pin one pane while the other scrolls.
 */

@Component({
  selector: 'sd-split-view',
  standalone: true,
  templateUrl: './sd-split-view.html',
  styleUrl: './sd-split-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.sticky-detail]': 'stickyDetail() ? "" : null',
    '[attr.sticky-master]': 'stickyMaster() ? "" : null',
  },
})
export class SdSplitView {
  readonly stickyDetail = input(false, {
    alias: 'sticky-detail',
    transform: booleanAttribute,
  });
  readonly stickyMaster = input(false, {
    alias: 'sticky-master',
    transform: booleanAttribute,
  });
}
