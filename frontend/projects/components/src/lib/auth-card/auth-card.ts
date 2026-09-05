import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * The card inside `sd-auth-shell`. Mirrors `.auth-card` in
 * docs/mocks-v2/styles/app.css: an optional disc (`[slot=disc]`), the h1
 * and subtitle (centred with `center`), the projected form, and the alt
 * line (`[slot=alt]`, "New here? Create an account").
 */
@Component({
  selector: 'sd-auth-card',
  standalone: true,
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'auth-card',
    '[attr.title]': 'cardTitle() || null',
    '[attr.center]': 'center() ? "" : null',
  },
})
export class AuthCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly center = input(false, { transform: booleanAttribute });
}
