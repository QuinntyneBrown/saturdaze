import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * One shimmering placeholder row shaped like a block. Mirrors
 * `.skeleton-row` in docs/mocks-v2/styles/app.css; the shimmer stops under
 * `prefers-reduced-motion`.
 */
@Component({
  selector: 'sd-skeleton-row',
  standalone: true,
  templateUrl: './skeleton-row.html',
  styleUrl: './skeleton-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'skeleton-row',
    'aria-hidden': 'true',
  },
})
export class SkeletonRow {}
