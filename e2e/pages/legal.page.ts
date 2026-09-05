import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

export type LegalDoc = "terms" | "privacy";

/**
 * Legal — pages/legal.html (site shell). Terms and Privacy on one template;
 * the `#privacy` fragment switches `body[data-doc]`, which shows exactly one
 * `article.prose[data-doc]` and moves `aria-current` on the `.doc-switch`.
 */
export class LegalPage extends BasePage {
  readonly slug: PageSlug = "legal";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".prose__title");
  }

  get docSwitch(): Locator {
    return this.main.locator(".doc-switch");
  }

  docTab(name: "Terms" | "Privacy"): Locator {
    return this.docSwitch.locator(".segments__tab", { hasText: name });
  }

  activeDocTab(): Locator {
    return this.docSwitch.locator('.segments__tab[aria-current="page"]');
  }

  article(doc: LegalDoc): Locator {
    return this.main.locator(`article.prose[data-doc="${doc}"]`);
  }

  /** The article the current `body[data-doc]` reveals. */
  visibleArticle(): Locator {
    return this.main.locator("article.prose").filter({ visible: true });
  }

  proseTitle(doc: LegalDoc): Locator {
    return this.article(doc).locator(".prose__title");
  }

  proseUpdated(doc: LegalDoc): Locator {
    return this.article(doc).locator(".prose__updated");
  }

  toc(doc: LegalDoc): Locator {
    return this.article(doc).locator(".prose__toc a");
  }

  get footer(): Locator {
    return this.main.locator(".site-footer");
  }

  footerLink(name: "Terms" | "Privacy" | "Sign in"): Locator {
    return this.footer.getByRole("link", { name, exact: true });
  }
}
