import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * The all-purpose surface. Mirrors `.card` in docs/mocks-v2/styles/app.css:
 * the host is the card, modifiers are host classes. Typed cards
 * (activity / food / event / past) own their internal structure; this one
 * is a plain container for dialogs, review and family.
 */

export type CardVariant = 'default' | 'sunk';
export type CardPadding = 'md' | 'lg';

@Component({
  selector: 'sd-card',
  standalone: true,
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card',
    '[class.card--sunk]': 'variant() === "sunk"',
    '[class.card--pad-lg]': 'padding() === "lg"',
    '[class.card--locked]': 'locked()',
    '[class.card--dimmed]': 'dimmed()',
    '[class.card--muted]': 'muted()',
    '[class.card--span]': 'span()',
    '[class.card--interactive]': 'interactive()',
    '[attr.variant]': 'variant() === "default" ? null : variant()',
    '[attr.padding]': 'padding() === "md" ? null : padding()',
    '[attr.locked]': 'locked() ? "" : null',
    '[attr.dimmed]': 'dimmed() ? "" : null',
    '[attr.muted]': 'muted() ? "" : null',
    '[attr.span]': 'span() ? "" : null',
    '[attr.interactive]': 'interactive() ? "" : null',
  },
})
export class Card {
  readonly variant = input<CardVariant>('default');
  readonly padding = input<CardPadding>('md');
  /** 2px accent border (a locked restaurant). */
  readonly locked = input(false, { transform: booleanAttribute });
  /** 60% opacity (siblings of a locked pick). */
  readonly dimmed = input(false, { transform: booleanAttribute });
  /** 85% opacity (a pending suggestion). */
  readonly muted = input(false, { transform: booleanAttribute });
  /** Spans every column of a card grid (the top pick). */
  readonly span = input(false, { transform: booleanAttribute });
  readonly interactive = input(false, { transform: booleanAttribute });
}
