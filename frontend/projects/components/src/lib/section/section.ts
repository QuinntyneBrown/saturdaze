import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Titled region of a page. Mirrors `.section` + `.section-header` in
 * docs/mocks-v2/styles/app.css. `[slot=action]` sits at the right of the
 * header (the quiet "Edit" buttons on Family); the default slot is the body.
 */

let nextSectionId = 0;

@Component({
  selector: 'sd-section',
  standalone: true,
  templateUrl: './section.html',
  styleUrl: './section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'section',
    '[attr.title]': 'sectionTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
    '[attr.aria-labelledby]': 'sectionTitle() ? headingId : null',
  },
})
export class Section {
  readonly sectionTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');

  protected readonly headingId = `sd-section-${nextSectionId++}`;
}
