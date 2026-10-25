import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

/**
 * Agent runs (A7) — pages/admin.agent-runs.html (L2-210).
 *
 *   .page-header  "Agent runs"
 *   .stat-grid    .stat[aria-labelledby]  .stat__label · .stat__figure · .stat__sub (· .stat__bar on spend)
 *   .queue        .card[aria-label="Run …"]  .card__title "Weekend of 31 Oct · Scheduled" · .card__meta · .chip (status)
 *                 .run__trace code + "Copy trace id …"
 *   empty         .empty__title "No agent runs yet."
 */
export class AdminAgentRunsPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".queue, .empty__title");
  }

  statCard(label: "Runs today" | "Applied today" | "Fell back today" | "Spend this month"): Locator {
    return this.main.locator(".stat-grid .stat").filter({ has: this.page.locator(".stat__label", { hasText: label }) });
  }

  statFigure(label: Parameters<AdminAgentRunsPage["statCard"]>[0]): Locator {
    return this.statCard(label).locator(".stat__figure");
  }

  statSub(label: Parameters<AdminAgentRunsPage["statCard"]>[0]): Locator {
    return this.statCard(label).locator(".stat__sub");
  }

  runs(): Locator {
    return this.main.locator(".queue .card");
  }

  runTitle(run: Locator): Locator {
    return run.locator(".card__title");
  }

  runMeta(run: Locator): Locator {
    return run.locator(".card__meta");
  }

  runStatus(run: Locator): Locator {
    return run.locator(".card__head .chip");
  }

  runTrace(run: Locator): Locator {
    return run.locator(".run__trace code");
  }

  copyTraceButton(run: Locator): Locator {
    return control(run, /^Copy trace id /);
  }

  emptyTitle(): Locator {
    return this.main.locator(".empty__title");
  }
}
