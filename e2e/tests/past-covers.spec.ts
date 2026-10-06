import { test, expect } from "../fixtures/sd-test.js";
import { ensureCurrentWeekend, registerThrowaway } from "../fixtures/auth.js";
import { planWeekend, uploadCover } from "../fixtures/covers.js";
import { addDaysIso } from "../fixtures/dates.js";
import { FAMILY_PHOTO } from "../fixtures/weekend-cover.js";

/** Past cards lead with the weekend's cover (L2-110). */

test.describe("Past weekends — covers", () => {
  test("a weekend with the family's photo leads with it, labelled 'Your photo'", async ({ page, pages, request, signIn }) => {
    // Traces to: L2-110 AC1
    const session = (await signIn(await registerThrowaway(request, "cover")))!;
    const weekend = await ensureCurrentWeekend(request, session);
    await uploadCover(request, session, weekend.id);

    await page.goto("/past");
    const p = pages.past;
    await p.waitForReady();
    const card = p.cards().first();

    await expect(p.cardCoverCredit(card)).toHaveText("Your photo");
    await expect.poll(() => p.cardCoverLoaded(card)).toBe(true);
  });

  test("a weekend without a cover offers 'Add a photo', which opens the cover dialog", async ({ page, pages, request, signIn }) => {
    // Traces to: L2-110 AC2
    const session = (await signIn(await registerThrowaway(request, "nocover")))!;
    await ensureCurrentWeekend(request, session);

    await page.goto("/past");
    const p = pages.past;
    await p.waitForReady();
    const card = p.cards().first();
    const title = (await p.cardTitle(card).innerText()).trim();

    await expect(p.addPhotoControl(card)).toHaveAccessibleName(`Add a photo to ${title}`);
    await p.addPhotoControl(card).click();
    await expect(p.dialogTitle()).toHaveText("Cover photo");

    await p.chooseOwnPhoto(FAMILY_PHOTO);
    await p.dialogAction("Use this photo").click();
    await expect(p.dialog()).toHaveCount(0);
    await expect(p.cardCoverCredit(card)).toHaveText("Your photo");
  });

  test("1, 2 and 3 columns at 390, 820 and 1440 px, with 16:9 covers", async ({ page, pages, request, signIn }, testInfo) => {
    // Traces to: L2-110 AC4
    const session = (await signIn(await registerThrowaway(request, "columns")))!;
    const current = await ensureCurrentWeekend(request, session);
    await planWeekend(request, session, addDaysIso(current.weekendOf, -7));
    await planWeekend(request, session, addDaysIso(current.weekendOf, -14));
    await page.goto("/past");
    const p = pages.past;
    await p.waitForReady();
    await expect(p.cards()).toHaveCount(3);

    const width = testInfo.project.use.viewport?.width ?? 1440;
    expect(await p.columnCount()).toBe(width >= 1440 ? 3 : width >= 820 ? 2 : 1);
    const box = (await p.cardMedia(p.cards().first()).boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
  });
});
