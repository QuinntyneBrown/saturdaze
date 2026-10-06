import { test, expect } from "../fixtures/sd-test.js";
import { FAMILY_PHOTO, stubWeekendCover } from "../fixtures/weekend-cover.js";

/** D28 "Your own photo" — family cover uploads (L2-097). */

test.describe("Weekend — upload a cover photo", () => {
  test("a family photo becomes the cover, labelled as theirs", async ({ page, goto, pages }) => {
    // Traces to: L2-097 (D28 "Your own photo"), L2-096 AC2
    const stub = await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.changePhotoButton().click();
    await w.chooseOwnPhoto(FAMILY_PHOTO);
    await w.dialogAction("Use this photo").click();

    await expect(w.dialog()).toHaveCount(0);
    expect(stub.uploads).toBe(1);
    await expect(w.coverCredit()).toHaveText("Your photo");
    await expect.poll(() => w.coverImageLoaded()).toBe(true);
  });

  test("a file over 10 MB is refused before it is sent", async ({ page, goto, pages }) => {
    // Traces to: L2-097 AC3
    const stub = await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.changePhotoButton().click();
    await w.chooseOwnPhoto({ name: "huge.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(11 * 1024 * 1024, 0xff) });

    await expect(w.coverPhotoError()).toHaveText(/10 MB/);
    await expect(w.dialogAction("Use this photo")).toBeDisabled();
    expect(stub.uploads).toBe(0);
  });

  test("a file that is not really a photo is explained, and the dialog stays open", async ({ page, goto, pages }) => {
    // Traces to: L2-097 AC2
    const stub = await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.changePhotoButton().click();
    await w.chooseOwnPhoto({ name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from("%PDF-1.7\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n") });
    await w.dialogAction("Use this photo").click();

    await expect(w.coverPhotoError()).toHaveText(/JPEG, PNG or WebP/);
    await expect(w.dialog()).toHaveCount(1);
    expect(stub.uploads).toBe(1);
  });
});
