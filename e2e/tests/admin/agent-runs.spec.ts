// Acceptance Test
// Traces to: L2-210 AC1, AC2, AC3
// Description: Saturdaze Admin lists agent runs with today's and this month's totals.

import { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Only real Foundry runs produce applied drafts, and the e2e API has agent
 * planning off, so the screen is served from a route mock; the endpoint
 * itself is covered by the API tests (AgentRunsAndTracingTests).
 */

const TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";

async function serveRuns(page: Page, runs: unknown[]) {
  const applied = runs.filter((r) => (r as { status: string }).status === "Applied").length;
  await page.route(/\/api\/admin\/agent-runs(\?|$)/, (route) =>
    route.fulfill({
      json: {
        runs,
        totals: {
          runsToday: runs.length,
          appliedToday: applied,
          fellBackToday: runs.length - applied,
          spendThisMonthUsd: 3.18,
          monthlyCapUsd: 25,
          runsPerDayCap: 60,
        },
      },
    }),
  );
}

const RUNS = [
  {
    id: "r1",
    weekendOf: "2026-10-31",
    trigger: "Scheduled",
    status: "Applied",
    fallbackReason: null,
    queuedUtc: "2026-10-30T12:00:00+00:00",
    startedUtc: "2026-10-30T12:00:00+00:00",
    finishedUtc: "2026-10-30T12:01:20+00:00",
    rounds: 2,
    modelCalls: 7,
    toolCalls: 12,
    webSearches: 0,
    inputTokens: 48210,
    outputTokens: 3904,
    costUsd: 0.2032,
    traceId: TRACE,
    policyViolations: 0,
  },
  {
    id: "r2",
    weekendOf: "2026-10-31",
    trigger: "OnDemand",
    status: "FellBack",
    fallbackReason: "Timeout",
    queuedUtc: "2026-10-30T12:03:00+00:00",
    startedUtc: "2026-10-30T12:03:00+00:00",
    finishedUtc: "2026-10-30T12:08:00+00:00",
    rounds: 1,
    modelCalls: 2,
    toolCalls: 3,
    webSearches: 0,
    inputTokens: 9880,
    outputTokens: 0,
    costUsd: 0.0296,
    traceId: "00f067aa0ba902b7a3ce929d0e0e4736",
    policyViolations: 0,
  },
];

test.describe("Admin agent runs", () => {
  test("shows today's totals and each run with its status, usage, cost and trace", async ({ page, goto, pages }) => {
    // Traces to: L2-210 AC1
    await serveRuns(page, RUNS);
    await goto("adminAgentRuns");
    const a = pages.adminAgentRuns;
    await a.waitForScreen("agent-runs");

    await expect(a.pageTitle()).toHaveText("Agent runs");
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "agents");
    await expect(a.statFigure("Runs today")).toHaveText("2");
    await expect(a.statSub("Runs today")).toHaveText("of 60 allowed a day");
    await expect(a.statFigure("Applied today")).toHaveText("1");
    await expect(a.statFigure("Fell back today")).toHaveText("1");
    await expect(a.statFigure("Spend this month")).toHaveText("US$3.18");
    await expect(a.statSub("Spend this month")).toHaveText("of the US$25.00 monthly cap");

    await expect(a.runs()).toHaveCount(2);
    const [first, second] = [a.runs().nth(0), a.runs().nth(1)];
    await expect(a.runTitle(first)).toHaveText("Weekend of 31 Oct · Scheduled");
    await expect(a.runMeta(first)).toHaveText(
      "30 Oct 2026, 12:00pm UTC · 2 rounds · 7 model calls · 48,210 in / 3,904 out · US$0.2032",
    );
    await expect(a.runStatus(first)).toHaveText("Applied");
    await expect(a.runTrace(first)).toHaveText(TRACE);
    await expect(a.copyTraceButton(first)).toBeVisible();
    await expect(a.runTitle(second)).toHaveText("Weekend of 31 Oct · On demand");
    await expect(a.runStatus(second)).toHaveText("Fell back · Timeout");
  });

  test("says when there are no runs yet", async ({ page, goto, pages }) => {
    // Traces to: L2-210 AC2
    await serveRuns(page, []);
    await goto("adminAgentRuns");
    const a = pages.adminAgentRuns;
    await a.waitForScreen("agent-runs");

    await expect(a.emptyTitle()).toHaveText("No agent runs yet.");
    await expect(a.runs()).toHaveCount(0);
  });

  for (const width of [390, 1440]) {
    test(`fits ${width}px without scrolling sideways`, async ({ page, goto, pages }) => {
      // Traces to: L2-210 AC3
      await page.setViewportSize({ width, height: 900 });
      await serveRuns(page, RUNS);
      await goto("adminAgentRuns");
      const a = pages.adminAgentRuns;
      await a.waitForScreen("agent-runs");
      await expect(a.runs()).toHaveCount(2);
      expect(await a.hasHorizontalOverflow()).toBe(false);
    });
  }
});
