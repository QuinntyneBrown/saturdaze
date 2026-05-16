import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Horizontal scrollable strip of chips / tags. Mirrors
 * `docs/mocks/components/sd-tag-group.js`.
 */

@Component({
  selector: 'sd-tag-group',
  standalone: true,
  templateUrl: './tag-group.html',
  styleUrl: './tag-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagGroup {}
