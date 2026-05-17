import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Centered shell for the signed-out auth screens. Renders the brand on top,
 * the projected auth card below, and an optional foot link slot.
 *
 * Mirrors the `.auth-shell` + `.brand` blocks in `docs/mocks/pages/login.html`
 * (and the other auth mocks — they share this chrome 1:1).
 */
@Component({
  selector: 'sd-auth-shell',
  standalone: true,
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShell {}
