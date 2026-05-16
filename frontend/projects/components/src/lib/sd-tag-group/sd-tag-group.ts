import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Horizontal scrollable strip of chips / tags. Mirrors
 * `docs/mocks/components/sd-tag-group.js`.
 */

@Component({
  selector: 'sd-tag-group',
  standalone: true,
  templateUrl: './sd-tag-group.html',
  styleUrl: './sd-tag-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTagGroup {}
