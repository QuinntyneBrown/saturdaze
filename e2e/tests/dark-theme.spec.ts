import { test, expect } from "../fixtures/sd-test.js";
import { contrast, luminance } from "../fixtures/colour.js";
import { FAMILY_PHOTO, stubWeekendCover } from "../fixtures/weekend-cover.js";

/**
 * The reader's colour scheme (L2-130, drift D25). When the system prefers
 * dark, every page takes the dark theme built from the same roles as light:
 * warm umber surfaces, light text, a lighter coral fill with a dark label.
 * Text over a photo stays white. Otherwise the light theme stays.
 */

const CREAM_CANVAS = "rgb(250, 247, 242)";
const WHITE = "rgb(255, 255, 255)";

test.describe("The reader's colour scheme", () => {
  test("Given a system that prefers dark, when the family page opens, then the page is dark and its title light", async ({
    goto,
    pages,
  }) => {
    const f = pages.family;
    await f.preferColorScheme("dark");
    await goto("family");
    await f.waitForReady();

    const canvas = await f.pageBackground();
    expect(luminance(canvas)).toBeLessThan(0.05);
    expect(
      contrast(await f.textColor(f.pageTitle()), canvas),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("Given a system that prefers light, when the family page opens, then the page keeps the cream canvas", async ({
    goto,
    pages,
  }) => {
    const f = pages.family;
    await f.preferColorScheme("light");
    await goto("family");
    await f.waitForReady();

    expect(await f.pageBackground()).toBe(CREAM_CANVAS);
  });

  test("Given a system that prefers dark, when the sign-in page opens, then the primary action is a light coral fill with a dark label", async ({
    goto,
    pages,
  }) => {
    const s = pages.signIn;
    await s.preferColorScheme("dark");
    await goto("signIn");
    await s.waitForReady();

    const fill = await s.fillColor(s.signInButton());
    const label = await s.textColor(s.signInButton());
    expect(luminance(fill)).toBeGreaterThan(luminance(label));
    expect(contrast(label, fill)).toBeGreaterThanOrEqual(4.5);
  });

  test("Given a system that prefers dark, when a family photo is chosen for the cover, then its name stays white over the photo", async ({
    page,
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await w.preferColorScheme("dark");
    await stubWeekendCover(page);
    await goto("weekend");
    await w.waitForPlan();
    await w.changePhotoButton().click();
    await w.chooseOwnPhoto(FAMILY_PHOTO);

    expect(await w.textColor(w.ownPhotoName())).toBe(WHITE);
  });

  test("Given a system that prefers dark, when the weekend cover shows, then its title stays white over a dark scrim", async ({
    page,
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await w.preferColorScheme("dark");
    await stubWeekendCover(page);
    await goto("weekend");
    await w.waitForPlan();

    expect(await w.textColor(w.coverTitle())).toBe(WHITE);
    expect(luminance(await w.coverScrimColour())).toBeLessThan(0.05);
  });
});
