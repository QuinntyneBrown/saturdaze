import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

/**
 * Photo health (A2, the admin home) — pages/admin.html.
 *
 *   .page-header  "Photo health" · [Review N new photos] → /reviews
 *   .stat-grid    .stat[aria-labelledby]  .stat__label · .stat__figure (<strong>16</strong> of 20)
 *                 · .stat__bar[role=img] · .stat__list .stat__link (.chip--count + label)
 *   .section "Worst first"  .list--card .place-row (as on Places) · "All places" → /places
 */
export class AdminHealthPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".stat-grid .stat__figure");
  }

  reviewButton(): Locator {
    return control(this.pageHeader, /Review .* new photo/);
  }

  get statGrid(): Locator {
    return this.main.locator(".stat-grid");
  }

  statCards(): Locator {
    return this.statGrid.locator(".stat");
  }

  statCard(label: string): Locator {
    return this.statCards().filter({ has: this.page.locator(".stat__label", { hasText: label }) });
  }

  statFigure(card: Locator): Locator {
    return card.locator(".stat__figure");
  }

  statBar(card: Locator): Locator {
    return card.locator(".stat__bar");
  }

  statLink(card: Locator, label: string | RegExp): Locator {
    return card.locator(".stat__link", { hasText: label });
  }

  statLinkCount(link: Locator): Locator {
    return link.locator(".chip");
  }

  /** How many columns the stat grid resolves to at the current viewport. */
  async statGridColumns(): Promise<number> {
    return this.statGrid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
  }

  worstRows(): Locator {
    return this.main.locator(".worst .place-row");
  }

  allPlacesLink(): Locator {
    return control(this.main.locator(".worst"), "All places");
  }
}
