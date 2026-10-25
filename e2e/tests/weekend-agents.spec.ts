// Acceptance Test
// Traces to: L2-211 AC1, AC2, AC3, AC4, AC5
// Description: The Weekend page drafts with agents, shows their picks and reasons, and explains a fallback.

import { test, expect } from "../fixtures/sd-test.js";
import { registerThrowaway } from "../fixtures/auth.js";
import { NOTICES, PICK_REASON, refuseDraftRequests, stubAgentDraft } from "../fixtures/agent-draft.js";

const DRAFTING =
  "Agents are drafting your weekend — researching what's on, checking it against your family, then fitting it around your commitments. This usually takes a minute or two.";

test.describe("Weekend — drafted with agents", () => {
  test("drafting keeps the plan visible, then says the planner made it while agent planning is off", async ({
    request,
    signIn,
    goto,
    pages,
  }) => {
    // Traces to: L2-211 AC1, AC4, AC5
    test.setTimeout(90_000);
    // A fresh family: each weekend allows three on-demand drafts.
    await signIn(await registerThrowaway(request, "agents"));
    await goto("weekend", { anonymous: true });
    const w = pages.weekend;
    await w.waitForPlan();

    await w.draftWithAgents();

    await expect(w.statusRow()).toHaveText(DRAFTING);
    await expect(w.planner()).toHaveAttribute("aria-busy", "true");
    await expect(w.blocks("Saturday").first()).toBeVisible();
    expect(await w.hasHorizontalOverflow()).toBe(false);

    // The e2e API has agent planning off: the run falls back and the page reloads the weekend.
    await expect(w.standardPlanBanner()).toContainText(NOTICES.Disabled, { timeout: 30_000 });
    await expect(w.statusRow()).toHaveCount(0);
    await expect(w.tryAgainButton()).toHaveCount(0);
    await expect(w.planner()).not.toHaveAttribute("aria-busy", "true");
    expect(await w.hasHorizontalOverflow()).toBe(false);
  });

  test("an agent-drafted weekend says so and gives each pick's reason", async ({ page, goto, pages }) => {
    // Traces to: L2-211 AC2, AC5
    const stub = await stubAgentDraft(page, { outcome: "Applied" });
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await expect(w.draftedChip()).toHaveText("Drafted for your family");
    await expect(w.standardPlanBanner()).toHaveCount(0);
    expect(stub.pick).not.toBeNull();
    await expect(w.blockSubtitle(w.block(stub.pick!, "Saturday"))).toHaveText(PICK_REASON);
    expect(await w.hasHorizontalOverflow()).toBe(false);

    await w.openBlockDetails(stub.pick!, "Saturday");
    await expect(w.dialogWellTitles()).toContainText(["Why this pick"]);
  });

  test("a draft that could not finish shows the notice and Try again, and a refused retry says why", async ({
    page,
    goto,
    pages,
  }) => {
    // Traces to: L2-211 AC3, AC5
    await stubAgentDraft(page, { outcome: "Error" });
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await expect(w.standardPlanBanner()).toContainText(NOTICES.Error);
    await expect(w.draftedChip()).toHaveCount(0);
    expect(await w.hasHorizontalOverflow()).toBe(false);

    const limit = "This weekend has had 3 drafts already. Try again next weekend.";
    await refuseDraftRequests(page, 429, limit);
    await w.tryAgainButton().click();
    await expect(w.standardPlanBanner()).toContainText(limit);
    await expect(w.statusRow()).toHaveCount(0);
  });
});
