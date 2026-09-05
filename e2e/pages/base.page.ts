/**
 * Shared chrome present on every Saturdaze screen.
 *
 * Locators follow the v2 DOM contract (`docs/mocks-v2/styles/app.css` BEM
 * classes, `data-nav`, `aria-current`, `aria-pressed`, roles + accessible
 * names). The Angular components render exactly the same classes on their
 * host / inner elements, so one locator set serves both the baseline
 * capture (mocks) and the verify / behaviour runs (app).
 */

import { Locator, Page } from "@playwright/test";
import { PageSlug } from "../fixtures/routes.js";

export type NavKey = "weekend" | "ideas" | "past" | "family";
export type DayName = "Saturday" | "Sunday";

/** A control that may be an `<a>` (mocks, links) or a `<button>` (app). */
export function control(scope: Locator | Page, name: string | RegExp): Locator {
  return scope
    .getByRole("button", { name, exact: typeof name === "string" })
    .or(scope.getByRole("link", { name, exact: typeof name === "string" }));
}

export abstract class BasePage {
  /** `body[data-page]` this screen stamps. */
  abstract readonly slug: PageSlug;

  constructor(protected readonly page: Page) {}

  /** The element whose presence means the screen has rendered its content. */
  protected abstract readyAnchor(): Locator;

  /**
   * Waits for `body[data-page="<slug>"]` (route data in the app, a static
   * attribute in the mocks) and then for the page's own anchor element.
   */
  async waitForReady(slug: PageSlug = this.slug): Promise<void> {
    await this.page.waitForSelector(`body[data-page="${slug}"]`, { state: "attached", timeout: 10_000 });
    await this.readyAnchor().first().waitFor({ state: "attached", timeout: 10_000 });
  }

  /* ---------- Shell ---------- */

  get body(): Locator {
    return this.page.locator("body");
  }

  /** ≥720px only (`display: none` below). */
  get topbar(): Locator {
    return this.page.locator(".topbar");
  }

  /** <720px only (`display: none` at and above). */
  get bottomNav(): Locator {
    return this.page.locator(".bottom-nav");
  }

  /** Public pages (landing, legal, shared weekend): shown at every width. */
  get sitebar(): Locator {
    return this.page.locator(".sitebar");
  }

  /** `<main id="main" class="sd-frame">` in the app; `main#main` in the mocks. */
  get main(): Locator {
    return this.page.locator("main#main");
  }

  topbarLink(key: NavKey): Locator {
    return this.topbar.locator(`.topbar__link[data-nav="${key}"]`);
  }

  bottomNavLink(key: NavKey): Locator {
    return this.bottomNav.locator(`.bottom-nav__item[data-nav="${key}"]`);
  }

  /** The nav link for `key` in whichever chrome the current viewport shows. */
  navLink(key: NavKey): Locator {
    return this.page
      .locator(`.topbar__link[data-nav="${key}"], .bottom-nav__item[data-nav="${key}"]`)
      .filter({ visible: true });
  }

  /** The single visible nav link carrying `aria-current="page"`. */
  activeNavLink(): Locator {
    return this.page
      .locator('.topbar__link[aria-current="page"], .bottom-nav__item[aria-current="page"]')
      .filter({ visible: true });
  }

  brandLink(): Locator {
    return this.page.locator(".topbar__brand, .sitebar__brand").filter({ visible: true });
  }

  /** Top-bar avatar button (≥720). Opens the account menu (D26). */
  accountMenuButton(): Locator {
    return this.topbar.locator('[aria-label="Account menu"]');
  }

  /* ---------- Page header ---------- */

  get pageHeader(): Locator {
    return this.page.locator(".page-header");
  }

  pageTitle(): Locator {
    return this.pageHeader.locator(".page-header__title");
  }

  pageSubtitle(): Locator {
    return this.pageHeader.locator(".page-header__subtitle");
  }

  pageActions(): Locator {
    return this.pageHeader.locator(".page-header__actions");
  }

  /** Header action by accessible name ("Share", "Add to calendar", "Suggest an event"). */
  headerAction(name: string): Locator {
    return control(this.pageActions(), name);
  }

  /** The "More options" icon button (Weekend only). */
  moreButton(): Locator {
    return this.pageHeader.locator(".page-header__more");
  }

  /* ---------- Sections ---------- */

  sections(): Locator {
    return this.main.locator(".section");
  }

  section(title: string): Locator {
    return this.main.locator(".section").filter({
      has: this.page.locator(".section-header__title", { hasText: title }),
    });
  }

  sectionTitle(section: Locator): Locator {
    return section.locator(".section-header__title");
  }

  sectionSubtitle(section: Locator): Locator {
    return section.locator(".section-header__sub");
  }

  /* ---------- Filters ---------- */

  get filters(): Locator {
    return this.main.locator('[role="group"][aria-label="Filters"]');
  }

  filterChip(name: string): Locator {
    return this.filters.getByRole("button", { name, exact: true }).and(this.page.locator(".filter-chip"));
  }

  pressedFilterChips(): Locator {
    return this.filters.locator('.filter-chip[aria-pressed="true"]');
  }

  /* ---------- Empty / status states ---------- */

  get empty(): Locator {
    return this.main.locator(".empty");
  }

  emptyTitle(): Locator {
    return this.empty.locator(".empty__title");
  }

  emptyCta(name: string): Locator {
    return control(this.empty.locator(".empty__cta"), name);
  }

  statusRow(): Locator {
    return this.main.locator('.status-row[role="status"]');
  }

  skeletonRows(): Locator {
    return this.main.locator(".skeleton-row");
  }

  banner(tone: "warn" | "info" | "success" = "warn"): Locator {
    return this.page.locator(`.banner--${tone}`);
  }

  /* ---------- Dialogs & menus (CDK overlay; app only) ---------- */

  /** The open CDK dialog / alert dialog panel. */
  dialog(): Locator {
    return this.page
      .locator('.cdk-overlay-container [role="dialog"], .cdk-overlay-container [role="alertdialog"]')
      .filter({ visible: true });
  }

  dialogTitle(): Locator {
    return this.dialog().locator(".dialog__title");
  }

  dialogSubtitle(): Locator {
    return this.dialog().locator(".dialog__sub");
  }

  dialogBody(): Locator {
    return this.dialog().locator(".dialog__body");
  }

  /** Footer action by accessible name ("Cancel", "Regenerate", "Save"…). */
  dialogAction(name: string): Locator {
    return control(this.dialog().locator(".dialog__actions"), name);
  }

  /** The icon-only close button in the dialog header. */
  dialogClose(): Locator {
    return this.dialog().locator('button[aria-label="Close"]');
  }

  dialogField(label: string): Locator {
    return this.dialog().getByLabel(label, { exact: true });
  }

  /** Anchored menu (≥720): `.menu[role="menu"]` in the overlay. */
  menu(): Locator {
    return this.page.locator('.cdk-overlay-container .menu[role="menu"]').filter({ visible: true });
  }

  /**
   * A menu entry by name, in whichever form the viewport uses: a
   * `menuitem` in the anchored menu (≥720) or a list row inside the bottom
   * sheet dialog (<720).
   */
  menuItem(name: string): Locator {
    const overlay = this.page.locator(".cdk-overlay-container");
    return overlay
      .getByRole("menuitem", { name, exact: true })
      .or(overlay.locator(".list__item").filter({ has: this.page.locator(".list__title", { hasText: name }) }))
      .filter({ visible: true });
  }
}
