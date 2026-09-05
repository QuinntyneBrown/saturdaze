import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Dialogs gallery — pages/dialogs.html (`/dialogs` in the app, dev only).
 *
 * Thirty specimens rendered statically inline (no clicking), each wrapped in
 * `section.specimen#dialog-<slug>` holding either a `.dialog.dialog--specimen`
 * panel (role dialog / alertdialog) or a `.menu[role=menu]`.
 */
export const DIALOG_SLUGS = [
  // weekend
  "block",
  "block-locked",
  "block-commitment",
  "regenerate",
  "regenerate-day",
  "share",
  "calendar",
  "errand",
  "errand-added",
  // ideas
  "suggest",
  "submitted",
  "lock-in",
  // past
  "rate",
  "rename",
  "repeat",
  "remix",
  // family
  "member",
  "member-add",
  "commitment",
  "commitment-add",
  "home",
  "likes",
  "remove",
  "remove-commitment",
  "signout",
  // admin
  "approve",
  "reject",
  // menus
  "more",
  "more-menu",
  "account",
] as const;

export type DialogSlug = (typeof DIALOG_SLUGS)[number];

/** Specimens that render a `.menu` rather than a `.dialog`. */
export const MENU_SLUGS: readonly DialogSlug[] = ["more-menu", "account"];

/** Specimens whose panel is `role="alertdialog"` (destructive confirms). */
export const ALERT_SLUGS: readonly DialogSlug[] = ["remove", "remove-commitment", "signout"];

export class DialogsPage extends BasePage {
  readonly slug: PageSlug = "dialogs";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator("#dialog-block .dialog");
  }

  get gallery(): Locator {
    return this.main.locator(".gallery");
  }

  specimens(): Locator {
    return this.gallery.locator("section.specimen");
  }

  specimen(slug: DialogSlug): Locator {
    return this.page.locator(`#dialog-${slug}`);
  }

  specimenLabel(slug: DialogSlug): Locator {
    return this.specimen(slug).locator(".specimen__label");
  }

  /** The rendered panel: `.dialog` or `.menu`. */
  panel(slug: DialogSlug): Locator {
    return this.specimen(slug).locator(".dialog, .menu");
  }

  title(slug: DialogSlug): Locator {
    return this.panel(slug).locator(".dialog__title");
  }

  subtitle(slug: DialogSlug): Locator {
    return this.panel(slug).locator(".dialog__sub");
  }

  closeButton(slug: DialogSlug): Locator {
    return this.panel(slug).locator('button[aria-label="Close"]');
  }

  action(slug: DialogSlug, name: string): Locator {
    return control(this.panel(slug).locator(".dialog__actions"), name);
  }

  menuItems(slug: DialogSlug): Locator {
    return this.panel(slug).getByRole("menuitem");
  }
}
