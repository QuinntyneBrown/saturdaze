import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  DomSanitizer,
  SafeHtml,
} from '@angular/platform-browser';

/**
 * Single source of truth for iconography.
 *
 * Mirrors `docs/mocks/components/sd-icon.js`. Inline-SVG paths from a small
 * built-in set keep the runtime free of network calls. Stroke-based glyphs
 * pair with `stroke: currentColor` so `<sd-icon>` recolours with its parent.
 */

const ICONS: Record<string, string> = {
  sun:      `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  cloud:    `<path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 6 18h11Z"/>`,
  rain:     `<path d="M17 14a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 6 14h11Z"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/>`,
  snow:     `<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>`,
  lock:     `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  unlock:   `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>`,
  refresh:  `<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>`,
  swap:     `<path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/>`,
  map:      `<path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>`,
  car:      `<path d="M5 16h14M6 16l-1-5 3-4h8l3 4-1 5"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>`,
  fork:     `<path d="M7 3v8a2 2 0 0 0 4 0V3"/><path d="M9 11v10"/><path d="M16 3c-1.5 1.5-2 3-2 5s.5 2.5 2 3v10"/>`,
  home:     `<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>`,
  heart:    `<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>`,
  star:     `<path d="M12 3l2.7 5.7 6.3.9-4.5 4.4 1 6.3L12 17.8 6.5 20.3l1-6.3L3 9.6l6.3-.9L12 3z"/>`,
  user:     `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`,
  plus:     `<path d="M12 5v14M5 12h14"/>`,
  close:    `<path d="M6 6l12 12M18 6L6 18"/>`,
  edit:     `<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14 8l2 2"/>`,
  trash:    `<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/>`,
  arrow_left:    `<path d="M15 6l-6 6 6 6"/>`,
  arrow_right:   `<path d="M9 6l6 6-6 6"/>`,
  chevron_right: `<path d="M9 6l6 6-6 6"/>`,
  more:     `<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>`,
  bag:      `<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
  ticket:   `<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/>`,
  bed:      `<path d="M3 18v-7a2 2 0 0 1 2-2h6v6h10v3"/><circle cx="7" cy="12" r="2"/>`,
  bike:     `<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h5l3 8M10 9h-3"/>`,
  tree:     `<path d="M12 3l-5 7h3l-4 6h12l-4-6h3l-5-7z"/><path d="M12 16v5"/>`,
  popcorn:  `<path d="M6 9h12l-1 12H7L6 9z"/><path d="M6 9a2 2 0 0 1 3-2 2 2 0 0 1 3-1 2 2 0 0 1 3 1 2 2 0 0 1 3 2"/>`,
  thumbs_up:   `<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2v4h5a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 18 19H7"/>`,
  thumbs_down: `<path d="M7 13V4H4v9zM7 13l4 8a2 2 0 0 0 3-2v-4h5a2 2 0 0 0 2-2.3l-1-6A2 2 0 0 0 18 5H7"/>`,
  share:    `<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/>`,
  sparkle:  `<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/>`,
  key:      `<circle cx="8" cy="14" r="4"/><path d="M11 13l10-10M17 7l2 2"/>`,
  sign_out: `<path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>`,
  copy:     `<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>`,
  pin:      `<path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>`,
};

@Component({
  selector: 'sd-icon',
  standalone: true,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.name]': 'name()',
    '[attr.size]': 'size()',
    '[style.--_size.px]': 'size()',
  },
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input<string>('sparkle');
  readonly size = input<number>(20);

  protected readonly path = computed<SafeHtml>(
    () => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()] ?? ICONS['sparkle']!),
  );
}
