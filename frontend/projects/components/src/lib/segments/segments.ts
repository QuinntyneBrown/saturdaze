import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Pill-track tabs that are real links. Mirrors `.segments`. Each tab is a
 * `routerLink`; `aria-current="page"` comes from the router (exact match
 * when `tab.exact`) unless `active` names a tab explicitly (the legal page
 * switches on a URL fragment, which the router does not match on).
 *
 * With `mode="tabs"` the track is an ARIA tablist instead (the Weekend day
 * switch, L2-104): buttons with `aria-selected` and `aria-controls` naming each
 * tab's `panel`, arrow keys (wrapping) and Home/End moving between them, and `selected` two-way bound.
 */

export interface SegmentTab {
  readonly label: string;
  /** Nav mode: where the tab links. */
  readonly link?: string | readonly string[];
  /** Tabs mode: the id of the panel the tab controls. */
  readonly panel?: string;
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
    '[attr.role]': 'mode() === "tabs" ? "tablist" : "navigation"',
  },
})
export class Segments {
  readonly tabs = input<readonly SegmentTab[]>([]);
  readonly label = input<string>('Sections');
  readonly narrow = input(false, { transform: booleanAttribute });
  /** Explicitly active tab label; null = let the router decide. */
  readonly active = input<string | null>(null);
  /** `nav` (links, the default) or `tabs` (an ARIA tablist). */
  readonly mode = input<'nav' | 'tabs'>('nav');
  /** Tabs mode: the selected tab's label. */
  readonly selected = model<string | null>(null);

  protected linkOf(tab: SegmentTab): string | string[] {
    if (tab.link === undefined) return [];
    return typeof tab.link === 'string' ? tab.link : [...tab.link];
  }

  protected tabId(tab: SegmentTab): string {
    return `${tab.panel ?? tab.label}-tab`;
  }

  /**
   * APG Tabs keys (L2-139): arrows move along the track and wrap, Home and End
   * jump to the first and last tab; selection and focus follow.
   */
  protected onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    const target =
      event.key === 'ArrowRight'
        ? index + 1
        : event.key === 'ArrowLeft'
          ? index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : null;
    if (target === null) return;
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length];
    if (!next) return;
    this.selected.set(next.label);
    const host = (event.currentTarget as HTMLElement).parentElement;
    host?.querySelector<HTMLElement>(`#${CSS.escape(this.tabId(next))}`)?.focus();
  }
}
