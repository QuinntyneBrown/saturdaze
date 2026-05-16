import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Labelled content region. Mirrors `docs/mocks/components/sd-section.js`.
 * `flush` removes horizontal padding from the body when the children
 * already supply their own.
 */

@Component({
  selector: 'sd-section',
  standalone: true,
  templateUrl: './section.html',
  styleUrl: './section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'sectionTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
    '[attr.flush]': 'flush() ? "" : null',
  },
})
export class Section {
  readonly sectionTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly flush = input(false, { transform: booleanAttribute });
}
