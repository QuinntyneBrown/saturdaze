// Traces to: L2-047, L2-048
import { test, expect } from "../fixtures/sd-test.js";

test.describe("Submit-event form (mock)", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("eventsSubmit");
    await pages.eventsSubmit.waitForComponentsReady();
    await settle();
  });

  test("renders title input and a datetime input defaulted to a value", async ({ pages }) => {
    await expect(pages.eventsSubmit.headingTitle()).toBeVisible();
    await expect(pages.eventsSubmit.titleInput()).toBeVisible();

    const dt = pages.eventsSubmit.startsAtInput();
    await expect(dt).toBeVisible();
    const value = await dt.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("submit button is present", async ({ pages }) => {
    await expect(pages.eventsSubmit.submitButton()).toBeVisible();
  });
});
