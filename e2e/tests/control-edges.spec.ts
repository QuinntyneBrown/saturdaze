import { test, expect } from "../fixtures/sd-test.js";
import { stubWeekendCover } from "../fixtures/weekend-cover.js";

/**
 * Control edge contrast (drift D06, WCAG 1.4.11). Text field borders, the off
 * switch track, resting filter chips and vote buttons, and the dashed add and
 * upload edges read `--colorNeutralStrokeAccessible`, slate #80868F: 3.67:1
 * on white and 3.20:1 on wells. The old 16% ink line was 1.36:1.
 */

const ACCESSIBLE_STROKE = "rgb(128, 134, 143)"; // #80868F

test.describe("Control edge contrast", () => {
  test("Given the sign-in screen, when a person looks for the email field, then its border is the accessible stroke", async ({
    goto,
    pages,
  }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
    const s = pages.signIn;
    expect(await s.borderColor(s.emailInput())).toBe(ACCESSIBLE_STROKE);
  });

  test("Given the sign-in screen, when a person turns Remember me off, then its track is the accessible stroke", async ({
    goto,
    pages,
  }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
    const s = pages.signIn;
    await s.rememberToggle().click();
    await expect(s.rememberToggle()).not.toBeChecked();
    await s.settleTransitions(s.rememberTrack());
    expect(await s.fillColor(s.rememberTrack())).toBe(ACCESSIBLE_STROKE);
  });

  test("Given the activity ideas, when a person looks for a filter that is off, then its edge is the accessible stroke", async ({
    goto,
    pages,
  }) => {
    await goto("ideas");
    await pages.ideas.waitForReady();
    const i = pages.ideas;
    await expect(i.filterChip("Indoor")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(await i.borderColor(i.filterChip("Indoor"))).toBe(ACCESSIBLE_STROKE);
  });

  test("Given the food ideas, when a person looks for a vote no one has cast, then its edge is the accessible stroke", async ({
    goto,
    pages,
  }) => {
    await goto("ideasFood");
    await pages.ideas.waitForReady();
    const i = pages.ideas;
    const card = i.regularCards(i.lunchSection()).first();
    expect(await i.borderColor(i.restingVoteButton(card))).toBe(
      ACCESSIBLE_STROKE,
    );
  });

  test("Given the family page, when a person looks for the add-a-member row, then its dashed edge is the accessible stroke", async ({
    goto,
    pages,
  }) => {
    await goto("family");
    await pages.family.waitForReady();
    const f = pages.family;
    expect(await f.borderColor(f.addMemberRow())).toBe(ACCESSIBLE_STROKE);
  });

  test("Given the cover photo dialog, when a person looks for the upload tile, then its dashed edge is the accessible stroke", async ({
    page,
    goto,
    pages,
  }) => {
    await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    await w.changePhotoButton().click();
    expect(await w.borderColor(w.ownPhotoTile())).toBe(ACCESSIBLE_STROKE);
  });
});
