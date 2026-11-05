import { APIRequestContext, Page } from "@playwright/test";
import {
  Credentials,
  ensureCurrentWeekend,
  apiLogin,
  registerThrowaway,
  saveFamilyMembers,
} from "./auth.js";

/**
 * A throwaway family for the couples-date specs (L2-225), so the seeded family's
 * weekend never gets a date: two adults and two children, or one adult and a
 * child, with the current weekend planned.
 */
export async function dateFamily(
  request: APIRequestContext,
  shape: "couple-with-kids" | "one-adult" = "couple-with-kids",
): Promise<Credentials> {
  const account = await registerThrowaway(request, "date");
  const session = await apiLogin(request, account);
  await saveFamilyMembers(
    request,
    session,
    shape === "one-adult"
      ? [
          { name: "Sam", age: 40 },
          { name: "Kit", age: 8 },
        ]
      : [
          { name: "Ada", age: 41 },
          { name: "Ben", age: 39 },
          { name: "Cy", age: 9 },
          { name: "Di", age: 5 },
        ],
  );
  await ensureCurrentWeekend(request, session);
  return account;
}

/**
 * Past weekends can only get a date while they are current, so the history the
 * page reads is given one on its first weekend (L2-225 AC7).
 */
export async function stubPastDate(page: Page): Promise<void> {
  await page.route("**/api/weekends/history**", async (route) => {
    const response = await route.fetch();
    const items = (await response.json()) as Array<Record<string, unknown>>;
    if (items[0])
      items[0]["dates"] = [
        {
          day: "Sunday",
          meal: "Dinner",
          restaurant: "Snug Harbour",
          attendees: ["Ada", "Ben"],
        },
      ];
    await route.fulfill({ response, json: items });
  });
}
