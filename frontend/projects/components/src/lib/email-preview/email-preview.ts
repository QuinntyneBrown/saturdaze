import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Chip, ChipTone } from '../chip/chip';
import { Disc } from '../disc/disc';
import { Icon } from '../icon/icon';
import { SegRadio, SegRadioOption } from '../seg-radio/seg-radio';

/** One placeholder the preview filled: its value and where the value came from. */
export interface EmailPreviewPlaceholder {
  readonly name: string;
  readonly value: string;
  readonly source: 'sample' | 'builtin' | 'missing';
}

const WIDTHS: readonly SegRadioOption[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'phone', label: 'Phone' },
];

const FORMATS: readonly SegRadioOption[] = [
  { value: 'html', label: 'HTML' },
  { value: 'text', label: 'Plain text' },
];

const SOURCE: Record<EmailPreviewPlaceholder['source'], { tone: ChipTone; label: string }> = {
  sample: { tone: 'accent', label: 'Sample' },
  builtin: { tone: 'default', label: 'Built-in' },
  missing: { tone: 'warn', label: 'No sample value' },
};

/**
 * What a recipient would see (L2-128). Mirrors `.email-preview` in
 * docs/mocks/pages/admin.email.html: the subject and preheader as an inbox
 * line, the rendered HTML in an `<iframe sandbox>` that allows neither
 * scripts nor same-origin access (600 px wide on Desktop, 375 px on Phone),
 * the plain-text body, and the placeholders with where each value came
 * from. The frame's document also carries a CSP that blocks scripts and
 * every network fetch but HTTPS images and fonts.
 */
@Component({
  selector: 'sd-email-preview',
  standalone: true,
  imports: [ReactiveFormsModule, Chip, Disc, Icon, SegRadio],
  templateUrl: './email-preview.html',
  styleUrl: './email-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'email-preview',
    role: 'region',
    'aria-label': 'Preview',
  },
})
export class EmailPreview {
  private readonly sanitizer = inject(DomSanitizer);

  readonly subject = input<string>('');
  readonly preheader = input<string>('');
  /** The rendered HTML body (values already HTML-encoded by the renderer). */
  readonly html = input<string>('');
  /** The rendered plain-text body. */
  readonly text = input<string>('');
  readonly placeholders = input<readonly EmailPreviewPlaceholder[]>([]);
  /** Why the preview cannot refresh (unsafe HTML, a malformed placeholder); the last render stays. */
  readonly error = input<string>('');

  protected readonly widths = WIDTHS;
  protected readonly formats = FORMATS;
  protected readonly width = new FormControl('desktop', { nonNullable: true });
  protected readonly format = new FormControl('html', { nonNullable: true });
  protected readonly widthValue = toSignal(this.width.valueChanges, { initialValue: 'desktop' });
  protected readonly formatValue = toSignal(this.format.valueChanges, { initialValue: 'html' });

  /**
   * The frame's document. The sandbox (no `allow-scripts`, no `allow-same-origin`) is what
   * keeps template HTML inert; the trust bypass only stops Angular stripping the email's
   * own markup and inline styles before the sandbox gets it.
   */
  protected readonly srcdoc = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      '<!doctype html><html><head><meta charset="utf-8">' +
        '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: data:; style-src \'unsafe-inline\'; font-src https:">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        `</head><body style="margin:0">${this.html()}</body></html>`,
    ),
  );

  protected source(p: EmailPreviewPlaceholder): { tone: ChipTone; label: string } {
    return SOURCE[p.source] ?? SOURCE.missing;
  }
}
