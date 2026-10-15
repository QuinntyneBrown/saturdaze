import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The public pages' footer (landing, legal): Terms, Privacy and Sign in. The
 * shell renders it after `<main>`, so its `<footer>` is the page's
 * `contentinfo` landmark; inside `<main>` a footer is only generic (L2-138).
 */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {}
