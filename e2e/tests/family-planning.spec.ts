// Acceptance Test
// Traces to: L2-197 AC1, AC2, AC3, AC4, AC5, L2-192 AC7
// Description: The family edits how it plans, who goes to a commitment and where, and each member's interests.

import { APIRequestContext, Page } from "@playwright/test";
import { test, expect } from "../fixtures/sd-test.js";
import { API_URL, registerThrowaway, saveFamilyMembers, TestSession } from "../fixtures/auth.js";

const PLACE = "5980 McLaughlin Rd, Mississauga";

async function family(request: APIRequestContext, session: TestSession): Promise<Record<string, any>> {
  const res = await request.get(`${API_URL}/api/family`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return (await res.json()) as Record<string, any>;
}

/**
 * The e2e API runs without a geocoder; this stands in for one by adding the
 * coordinates the real geocoder would find for PLACE before the save goes on.
 */
async function geocodePlace(page: Page): Promise<void> {
  await page.route(/\/api\/family$/, async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    const body = route.request().postDataJSON() as { commitments?: { location?: { address: string } | null }[] };
    for (const c of body.commitments ?? [])
      if (c.location?.address === PLACE) Object.assign(c.location, { latitude: 43.6297, longitude: -79.7127 });
    await route.continue({ postData: JSON.stringify(body) });
  });
}

test.describe("Family — how you plan", () => {
  let session: TestSession;

  test.beforeEach(async ({ request, signIn, goto, pages }) => {
    session = (await signIn(await registerThrowaway(request, "plan")))!;
    await saveFamilyMembers(request, session, [
      { name: "Quinn", age: 41 },
      { name: "Mia", age: 6 },
    ]);
    await goto("family", { anonymous: true });
    await pages.family.waitForReady();
  });

  test("Max drive saves and its row says how far", async ({ request, pages }) => {
    // Traces to: L2-197 AC1
    const f = pages.family;
    await expect(f.planValue("Max drive")).toHaveText("Up to 2 h each way");

    await f.planRow("Max drive").click();
    await f.dialogField("Max drive").selectOption({ label: "1 h" });
    await f.saveDialog();

    await expect(f.planValue("Max drive")).toHaveText("Up to 1 h each way");
    expect((await family(request, session)).maxDriveMinutes).toBe(60);
  });

  test("What you celebrate leaves Halloween out and keeps it after a reload", async ({ page, pages }) => {
    // Traces to: L2-197 AC2
    const f = pages.family;
    await expect(f.planValue("What you celebrate")).toHaveText("Everything");

    await f.planRow("What you celebrate").click();
    await f.dialogCheckbox("Halloween").check();
    await f.saveDialog();

    await expect(f.planValue("What you celebrate")).toHaveText("Not Halloween");
    await page.reload();
    await f.waitForReady();
    await expect(f.planValue("What you celebrate")).toHaveText("Not Halloween");
  });

  test("Day shape sets when the day starts and how many outings it holds", async ({ request, pages }) => {
    // Traces to: L2-197 AC3
    const f = pages.family;
    await expect(f.planValue("Day shape")).toHaveText("Starts 9:00 · 2 outings a day");

    await f.planRow("Day shape").click();
    await f.dialogField("Day starts").selectOption({ label: "10:00" });
    await f.dialogSegment("Outings a day", "1").check();
    await f.dialogSwitch("Sunday dinner at home").uncheck();
    await f.saveDialog();

    await expect(f.planValue("Day shape")).toHaveText("Starts 10:00 · 1 outing a day");
    const saved = await family(request, session);
    expect(saved.outingsPerDay).toBe(1);
    expect(saved.sundayDinnerAtHome).toBe(false);
  });

  test("a commitment says who goes and where", async ({ page, request, pages }) => {
    // Traces to: L2-197 AC4
    await geocodePlace(page);
    const f = pages.family;

    await f.addCommitment({ title: "Swim — Mia", day: "Sunday", start: "16:20", end: "16:50", who: ["Mia"], where: PLACE });

    await expect(f.dialog()).toHaveCount(0);
    await expect(f.rowSubtitle(f.commitmentRow("Swim — Mia"))).toHaveText(
      "Sundays · 4:20pm to 4:50pm · Mia · 5980 McLaughlin Rd",
    );
    const swim = (await family(request, session)).commitments[0];
    expect(swim.location.address).toBe(PLACE);
    expect(swim.attendeeMemberIds).toHaveLength(1);

    // Editing keeps who goes and where.
    await f.commitmentRow("Swim — Mia").click();
    await expect(f.dialogCheckbox("Mia")).toBeChecked();
    await expect(f.dialogField("Where")).toHaveValue(PLACE);
  });

  test("a place the planner cannot find is explained inside the dialog", async ({ pages }) => {
    // Traces to: L2-192 AC7, L2-197
    const f = pages.family;

    await f.addCommitment({ title: "Piano", day: "Saturday", start: "10:00", end: "10:30", where: "Nowhere Lane, Atlantis" });

    await expect(f.dialogFieldError()).toHaveText(/We couldn't find that address\./);
    await expect(f.dialog()).toHaveCount(1);
    await expect(f.commitmentRow("Piano")).toHaveCount(0);
  });

  test("a member's interests are kept", async ({ request, pages }) => {
    // Traces to: L2-197
    const f = pages.family;

    await f.memberRow("Mia").click();
    await f.addInterest("Animals");
    await f.saveDialog();

    const mia = (await family(request, session)).members.find((m: { name: string }) => m.name === "Mia");
    expect(mia.interests).toEqual(["Animals"]);
  });

  test("the section fits the screen and every row is keyboard reachable", async ({ pages }) => {
    // Traces to: L2-197 AC5
    const f = pages.family;
    expect(await f.hasHorizontalOverflow()).toBe(false);
    for (const title of ["Max drive", "What you celebrate", "Day shape"] as const) {
      await f.tabTo(f.planRow(title));
      await expect(f.planRow(title)).toBeFocused();
    }
  });
});
