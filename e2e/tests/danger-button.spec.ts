import { test, expect } from "../fixtures/sd-test.js";

/**
 * Danger button contrast (drift D08, WCAG 1.4.3). A destructive confirm fills
 * with `--colorStatusDangerBackground3`, the brick red #AE2B2B: its white
 * label is 6.60:1, and it reads differently from the brand coral fill. The
 * old terracotta #C45A3F was 4.30:1 and too close to the brand.
 */

const BRICK_RED = "rgb(174, 43, 43)"; // #AE2B2B

test.describe("Danger button contrast", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("dialogs");
    await pages.dialogs.waitForReady();
  });

  test("Given a remove confirmation, when a person reads its Remove button, then it is filled brick red", async ({
    pages,
  }) => {
    const d = pages.dialogs;
    expect(await d.fillColor(d.action("remove", "Remove"))).toBe(BRICK_RED);
  });

  test("Given a reject confirmation, when a curator reads its Reject button, then it is filled brick red", async ({
    pages,
  }) => {
    const d = pages.dialogs;
    expect(await d.fillColor(d.action("reject", "Reject"))).toBe(BRICK_RED);
  });
});
