import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * The all-purpose container. Mirrors `docs/mocks/components/sd-card.js`.
 * Variants: `default | raised | sunk`. Padding: `sm | md | lg`. `interactive`
 * adds the lift-on-hover affordance used by tappable cards.
 */

export type SdCardVariant = 'default' | 'raised' | 'sunk';
export type SdCardPadding = 'sm' | 'md' | 'lg';

@Component({
  selector: 'sd-card',
  standalone: true,
  templateUrl: './sd-card.html',
  styleUrl: './sd-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.variant]': 'variant() === "default" ? null : variant()',
    '[attr.padding]': 'padding() === "md" ? null : padding()',
    '[attr.interactive]': 'interactive() ? "" : null',
  },
})
export class SdCard {
  readonly variant = input<SdCardVariant>('default');
  readonly padding = input<SdCardPadding>('md');
  readonly interactive = input(false, { transform: booleanAttribute });
}
