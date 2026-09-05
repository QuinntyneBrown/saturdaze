import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { isBaseline, PageSlug } from "../fixtures/routes.js";

/**
 * Shared auth chrome — sign-in / create-account / reset-password /
 * verify-email (bare shell, no top bar / bottom nav / sitebar).
 *
 *   main.auth > .auth__col
 *     a.auth__brand
 *     .auth-card  (.auth-card__head > .auth-card__title + .auth-card__sub,
 *                  optional .auth-card__disc / .banner--warn / .email-chip,
 *                  form.auth-card__form > .field (label + .field__input),
 *                  .strength, .auth-card__alt)
 *     p.auth__foot  Terms · Privacy · Back to Saturdaze
 *
 * The mocks stack every state of a screen on one page inside
 * `section.specimen#state-<id>`; the app renders exactly one card and
 * reaches the same state through `?state=<id>`. Pass the state id to the
 * locators when capturing baselines; omit it against the app.
 */
export abstract class AuthCardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".auth-card");
  }

  /** Baseline mode: scope to the `#state-<id>` specimen; app mode: the page. */
  protected scope(state?: string): Locator | Page {
    return isBaseline() && state ? this.page.locator(`#state-${state}`) : this.page;
  }

  brand(): Locator {
    return this.page.locator(".auth__brand");
  }

  foot(): Locator {
    return this.page.locator(".auth__foot");
  }

  footLink(name: "Terms" | "Privacy" | "Back to Saturdaze"): Locator {
    return this.foot().getByRole("link", { name, exact: true });
  }

  card(state?: string): Locator {
    return this.scope(state).locator(".auth-card");
  }

  cardTitle(state?: string): Locator {
    return this.card(state).locator(".auth-card__title");
  }

  cardSubtitle(state?: string): Locator {
    return this.card(state).locator(".auth-card__sub");
  }

  cardDisc(state?: string): Locator {
    return this.card(state).locator(".auth-card__disc");
  }

  form(state?: string): Locator {
    return this.card(state).locator("form.auth-card__form");
  }

  field(label: string, state?: string): Locator {
    return this.card(state).getByLabel(label, { exact: true });
  }

  fieldError(state?: string): Locator {
    return this.card(state).locator(".field__error");
  }

  /** `.banner--warn[role=alert]` (sign-in wrong password etc.). */
  errorBanner(state?: string): Locator {
    return this.card(state).locator('.banner--warn[role="alert"]');
  }

  emailChip(state?: string): Locator {
    return this.card(state).locator(".email-chip");
  }

  strength(state?: string): Locator {
    return this.card(state).locator(".strength");
  }

  strengthLabel(state?: string): Locator {
    return this.strength(state).locator(".strength__label");
  }

  /** A card button or link by accessible name. */
  action(name: string, state?: string): Locator {
    return control(this.card(state), name);
  }

  /** The `.auth-card__alt` link ("Create an account", "Sign in", "Back to sign in"). */
  altLink(name: string, state?: string): Locator {
    return this.card(state).locator(".auth-card__alt").getByRole("link", { name, exact: true });
  }
}

export type AuthSlug = Extract<PageSlug, "sign-in" | "create-account" | "reset-password" | "verify-email">;
