import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Pill-track tabs that are real links. Mirrors `.segments`. Each tab is a
 * `routerLink`; `aria-current="page"` comes from the router (exact match
 * when `tab.exact`) unless `active` names a tab explicitly (the legal page
 * switches on a URL fragment, which the router does not match on).
 */

export interface SegmentTab {
  readonly label: string;
  readonly link: string | readonly string[];
  readonly exact?: boolean;
  readonly fragment?: string;
}

@Component({
  selector: 'sd-segments',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './segments.html',
  styleUrl: './segments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'segments',
    '[class.segments--narrow]': 'narrow()',
    '[attr.aria-label]': 'label()',
    role: 'navigation',
  },
})
export class Segments {
  readonly tabs = input<readonly SegmentTab[]>([]);
  readonly label = input<string>('Sections');
  readonly narrow = input(false, { transform: booleanAttribute });
  /** Explicitly active tab label; null = let the router decide. */
  readonly active = input<string | null>(null);

  protected linkOf(tab: SegmentTab): string | string[] {
    return typeof tab.link === 'string' ? tab.link : [...tab.link];
  }
}
