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

export type CardVariant = 'default' | 'raised' | 'sunk';
export type CardPadding = 'sm' | 'md' | 'lg';

@Component({
  selector: 'sd-card',
  standalone: true,
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.variant]': 'variant() === "default" ? null : variant()',
    '[attr.padding]': 'padding() === "md" ? null : padding()',
    '[attr.interactive]': 'interactive() ? "" : null',
  },
})
export class Card {
  readonly variant = input<CardVariant>('default');
  readonly padding = input<CardPadding>('md');
  readonly interactive = input(false, { transform: booleanAttribute });
}
