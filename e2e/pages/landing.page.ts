import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Landing — pages/landing.html (site shell).
 *
 *   header.sitebar   brand · "Sign in" · [Create your account]
 *   main.landing
 *     section.hero   .hero__eyebrow · h1.hero__title "Two days. Already planned."
 *                    · .hero__lede · .hero__cta [Create your account] · .hero__alt "Sign in"
 *                    · .hero__preview (browser frame with a static miniature Weekend)
 *     section.how    h2 + ol.steps > li.step × 3
 *     footer.site-footer  Terms · Privacy · Sign in
 */
export class LandingPage extends BasePage {
  readonly slug: PageSlug = "landing";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".hero__title");
  }

  sitebarSignInLink(): Locator {
    return this.sitebar.getByRole("link", { name: "Sign in", exact: true });
  }

  sitebarCreateAccountLink(): Locator {
    return this.sitebar.getByRole("link", { name: "Create your account", exact: true });
  }

  get hero(): Locator {
    return this.main.locator(".hero");
  }

  heroTitle(): Locator {
    return this.hero.locator(".hero__title");
  }

  heroCta(): Locator {
    return this.hero.locator(".hero__cta").getByRole("link", { name: "Create your account", exact: true });
  }

  heroSignInLink(): Locator {
    return this.hero.locator(".hero__alt").getByRole("link", { name: "Sign in", exact: true });
  }

  heroPreview(): Locator {
    return this.hero.locator(".hero__preview");
  }

  previewBlocks(): Locator {
    return this.heroPreview().locator(".block");
  }

  get how(): Locator {
    return this.main.locator(".how");
  }

  steps(): Locator {
    return this.main.locator(".steps .step");
  }

  get footer(): Locator {
    return this.main.locator(".site-footer");
  }

  footerLink(name: "Terms" | "Privacy" | "Sign in"): Locator {
    return this.footer.getByRole("link", { name, exact: true });
  }
}
