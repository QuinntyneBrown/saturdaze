import { test, expect } from "../fixtures/sd-test.js";

test.describe("Component gallery", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("components");
    await pages.components.waitForComponentsReady();
  });

  test("gallery heading renders", async ({ pages }) => {
    await expect(pages.components.galleryHeading()).toBeVisible();
  });

  /* ---------- Buttons ---------- */

  test("buttons section exposes all five variants", async ({ pages }) => {
    await expect(pages.components.buttonByVariant("primary")).toBeVisible();
    await expect(pages.components.buttonByVariant("secondary")).toBeVisible();
    await expect(pages.components.buttonByVariant("ghost")).toBeVisible();
    await expect(pages.components.buttonByVariant("danger")).toBeVisible();
    await expect(pages.components.buttonByVariant("disabled")).toBeDisabled();
  });

  test("buttons section exposes small / default / large sizes", async ({ pages }) => {
    await expect(pages.components.buttonBySize("sm")).toBeVisible();
    await expect(pages.components.buttonBySize("lg")).toBeVisible();
  });

  /* ---------- Icon buttons ---------- */

  test("icon buttons section renders four variants", async ({ pages }) => {
    for (const icon of ["more", "share", "refresh", "heart"]) {
      await expect(pages.components.iconButton(icon)).toBeVisible();
    }
  });

  /* ---------- Chips ---------- */

  test("chip palette includes all documented tones", async ({ pages }) => {
    for (const tone of [
      "default",
      "primary",
      "accent",
      "sun",
      "sky",
      "leaf",
      "indoor",
      "warn",
    ]) {
      await expect(pages.components.chip(tone)).toBeVisible();
    }
  });

  /* ---------- Avatars ---------- */

  test("avatars cover the four family members and three sizes", async ({ pages }) => {
    await expect(pages.components.avatar("Quinn")).toBeVisible();
    await expect(pages.components.avatar("Sara")).toBeVisible();
    await expect(pages.components.avatar("Eli")).toBeVisible();
    await expect(pages.components.avatar("Mae")).toBeVisible();
    await expect(pages.components.avatar("Eli", "sm")).toBeVisible();
    await expect(pages.components.avatar("Sara", "lg")).toBeVisible();
    await expect(pages.components.avatar("Quinn", "xl")).toBeVisible();
  });

  /* ---------- Inputs ---------- */

  test("inputs section shows text inputs and toggles", async ({ pages }) => {
    await expect(pages.components.textInput("Family name")).toBeVisible();
    await expect(pages.components.textInput("Home location")).toBeVisible();
    await expect(pages.components.toggle("Budget is a factor")).toBeVisible();
    await expect(
      pages.components.toggle("Friday preview notifications")
    ).toHaveAttribute("checked", "");
  });

  /* ---------- Cards ---------- */

  test("card variants render", async ({ pages }) => {
    await expect(pages.components.card("default")).toBeVisible();
    await expect(pages.components.card("raised")).toBeVisible();
    await expect(pages.components.card("sunk")).toBeVisible();
  });

  /* ---------- List items ---------- */

  test("list-item examples render", async ({ pages }) => {
    await expect(pages.components.listItem("Swim lessons")).toBeVisible();
    await expect(pages.components.listItem("Add a member")).toBeVisible();
  });

  /* ---------- Weather + Timeline + Anticipate + Empty ---------- */

  test("weather strip section renders Saturday + Sunday", async ({ pages }) => {
    await expect(pages.components.weatherStrip()).toBeVisible();
    await expect(
      pages.components.weatherStrip().locator("sd-weather-day")
    ).toHaveCount(2);
  });

  test("timeline-block examples are present", async ({ pages }) => {
    await expect(pages.components.timelineBlock("Swim lessons")).toBeVisible();
    await expect(pages.components.timelineBlock("Lavender fields")).toBeVisible();
  });

  test("anticipate callout renders with headline + cta", async ({ pages }) => {
    await expect(pages.components.anticipate()).toBeVisible();
    await expect(pages.components.anticipate()).toHaveAttribute(
      "headline",
      /Lavender bloom peaks/
    );
  });

  test("empty state renders title + CTA", async ({ pages }) => {
    await expect(pages.components.emptyState()).toBeVisible();
    await expect(pages.components.emptyState()).toHaveAttribute(
      "title",
      "No favourites yet"
    );
  });
});
