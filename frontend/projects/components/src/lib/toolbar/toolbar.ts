import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** `search`: a wide first field and a narrow last one (search + sort). `fields`: equal fields. */
export type ToolbarLayout = 'search' | 'fields';

/**
 * The row of fields above a list: a search box and a sort, or a few
 * filter selects. Mirrors `.toolbar` in docs/mocks/pages/admin.places.html
 * and admin.activity.html. Fields stack on phones and sit in one row from
 * 720px; project `sd-text-input` / `sd-select` children.
 */
@Component({
  selector: 'sd-toolbar',
  standalone: true,
  template: '<ng-content />',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'toolbar',
    '[class.toolbar--fields]': 'layout() === "fields"',
  },
})
export class Toolbar {
  readonly layout = input<ToolbarLayout>('search');
}
