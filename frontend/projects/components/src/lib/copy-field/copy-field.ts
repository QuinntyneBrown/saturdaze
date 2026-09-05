import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * Read-only value with a Copy button (the share link). Mirrors
 * `.copy-field`. Copying flips the button to "Copied" for two seconds and
 * emits `copied`.
 */
@Component({
  selector: 'sd-copy-field',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './copy-field.html',
  styleUrl: './copy-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'copy-field',
    '[attr.value]': 'value()',
  },
})
export class CopyField {
  readonly value = input<string>('');
  readonly copied = output<string>();

  protected readonly justCopied = signal(false);

  protected async copy(): Promise<void> {
    const text = this.value();
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // Clipboard access can be denied (insecure context, permissions); the
      // value stays visible so the user can select it by hand.
    }
    this.justCopied.set(true);
    this.copied.emit(text);
    setTimeout(() => this.justCopied.set(false), 2000);
  }
}
