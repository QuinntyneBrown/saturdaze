// Screen recordings for video 45, Couples dates: the product (tools/video-record/record-clips.mjs).
// The mock clips open the static design reference in docs/mocks/pages/ from disk; the app clips
// run against the family app and the e2e API (eng/Start-E2eApi.ps1: SQLite, seeded Browns family,
// two adults and two children, so a date can be planned out of the box).

export const config = {
  baseURL: process.env.SD_APP_URL ?? "http://localhost:4200",
  apiURL: process.env.SD_API_URL ?? "http://localhost:5100",
  viewport: { width: 1408, height: 792 },
};

const EMAIL = process.env.SD_DEMO_EMAIL ?? "quinntynebrown@gmail.com";
const mocks = new URL("../../../mocks/pages/", import.meta.url).href;
const mock = (file) => `${mocks}${file}`;
const api = (path) => `${config.apiURL}${path}`;

async function session(t) {
  const login = await t.page.request.post(api("/api/auth/login"), {
    data: { email: EMAIL, password: "password123" },
  });
  return { Authorization: `Bearer ${(await login.json()).token.accessToken}` };
}

/** The current weekend, planned (idempotent). */
async function currentWeekend(t, headers) {
  const res = await t.page.request.get(api("/api/weekends/current"), { headers });
  return (await res.json()).id;
}

/** The weekend's one date, planned as Sunday dinner when there is none yet. */
async function currentDate(t) {
  const headers = await session(t);
  const weekendId = await currentWeekend(t, headers);
  const list = await (
    await t.page.request.get(api(`/api/weekends/${weekendId}/dates`), { headers })
  ).json();
  if (list.dates.length) return { weekendId, dateId: list.dates[0].id };
  const planned = await t.page.request.post(api(`/api/weekends/${weekendId}/dates`), {
    headers,
    data: { day: "Sunday", meal: "Dinner" },
  });
  return { weekendId, dateId: (await planned.json()).id };
}

async function cancelDates(t) {
  const headers = await session(t);
  const weekendId = await currentWeekend(t, headers);
  const list = await (
    await t.page.request.get(api(`/api/weekends/${weekendId}/dates`), { headers })
  ).json();
  for (const d of list.dates)
    await t.page.request.delete(api(`/api/weekends/${weekendId}/dates/${d.id}`), { headers });
}

/** Two past weekends for /past, one rated and titled (idempotent). */
async function stagePast(t) {
  const headers = await session(t);
  await currentWeekend(t, headers);
  for (const weekendOf of ["2026-10-24", "2026-10-17"])
    await t.page.request.post(api("/api/weekends/plan"), { headers, data: { weekendOf } });
  const history = await (
    await t.page.request.get(api("/api/weekends/history"), { headers })
  ).json();
  const [last] = history;
  if (last && !last.rating) {
    await t.page.request.put(api(`/api/weekends/${last.id}/rating`), {
      headers,
      data: { rating: 5 },
    });
    await t.page.request.put(api(`/api/weekends/${last.id}/title`), {
      headers,
      data: { title: "Harbour walk and brunch" },
    });
  }
}

const dialog = (t) => t.page.getByRole("dialog");
const header = (t) => t.page.locator(".page-header");
const day = (t, name) =>
  t.page.locator(".day").filter({ has: t.page.locator(".day__title", { hasText: name }) });
const settled = (t) =>
  t.page
    .locator(".status-row")
    .waitFor({ state: "detached", timeout: 60_000 })
    .catch(() => {});

async function waitForPlan(t) {
  await t.page.locator(".day").first().waitFor({ timeout: 90_000 });
  await t.page
    .locator(".skeleton, .skeleton-row")
    .first()
    .waitFor({ state: "detached", timeout: 60_000 })
    .catch(() => {});
  await t.wait(600);
}

async function waitForDate(t) {
  await t.page.locator(".date-plan .block").first().waitFor({ timeout: 90_000 });
  await t.wait(500);
}

const openMock = (file) => async (t) => {
  await t.page.goto(mock(file));
  await t.page.waitForLoadState("load");
};

export const setup = {
  "mock-weekend": openMock("weekend.html"),
  "mock-dialogs": openMock("dialogs.html#dialog-plan-date"),
  "mock-date": openMock("weekend.date.html"),
  "mock-food-past": openMock("ideas.food.html"),
  async "plan-date"(t) {
    await cancelDates(t);
    await t.signIn(EMAIL);
    await t.go("/weekend");
    await waitForPlan(t);
  },
  async "date-block"(t) {
    await currentDate(t);
    await t.signIn(EMAIL);
    await t.go("/weekend");
    await waitForPlan(t);
  },
  async "swap-activity"(t) {
    const { dateId } = await currentDate(t);
    await t.signIn(EMAIL);
    await t.go(`/weekend/dates/${dateId}`);
    await waitForDate(t);
  },
  async "move-cancel"(t) {
    const { dateId } = await currentDate(t);
    await t.signIn(EMAIL);
    await t.go(`/weekend/dates/${dateId}`);
    await waitForDate(t);
  },
  async "breakfast-past"(t) {
    await stagePast(t);
    // Past weekends cannot get a date (dates are for this weekend or next), so the history
    // the page reads is given one, as e2e/fixtures/couple-date.ts does.
    await t.page.route("**/api/weekends/history**", async (route) => {
      const response = await route.fetch();
      const items = await response.json();
      if (items[0])
        items[0].dates = [
          { day: "Sunday", meal: "Dinner", restaurant: "Snug Harbour", attendees: ["Quinn", "Sara"] },
        ];
      await route.fulfill({ response, json: items });
    });
    await t.signIn(EMAIL);
    await t.go("/ideas/food");
  },
};

export const clips = {
  /** The Weekend mock: Plan a date beside the other actions, then Sunday's date block. */
  async "mock-weekend"(t) {
    await t.wait(900);
    await t.hover(t.page.getByRole("link", { name: "Plan a date" }), 2200);
    await t.click(t.page.getByRole("tab", { name: "Sunday", exact: true }));
    await t.wait(1200);
    const block = t.page.locator(".block", { hasText: "Dinner date at Snug Harbour" });
    await t.hover(block.locator(".block__title"), 2200);
    await t.hover(block.locator(".chip", { hasText: "Date" }), 1600);
    await t.hover(block.locator(".chip", { hasText: "Kids need care" }), 2600);
  },

  /** The dialogs gallery: D38, D38b, then D39 to D43. */
  async "mock-dialogs"(t) {
    await t.wait(1400);
    const specimen = (id) => t.page.locator(`#${id}`);
    await t.hover(specimen("dialog-plan-date").locator(".check").first(), 2200);
    for (const [id, ms] of [
      ["dialog-plan-date-disabled", 3200],
      ["dialog-swap-date-restaurant", 2600],
      ["dialog-swap-date-activity", 2600],
      ["dialog-move-date", 2600],
      ["dialog-regenerate-date", 2400],
      ["dialog-cancel-date", 2800],
    ]) {
      await specimen(id).scrollIntoViewIfNeeded();
      await t.hover(specimen(id).locator(".dialog__title"), ms);
    }
  },

  /** The date's own screen: header, care banner, the plan, then its states. */
  async "mock-date"(t) {
    await t.wait(1000);
    await t.hover(t.page.locator(".page-header__subtitle"), 2000);
    await t.hover(t.page.locator(".date-care"), 2200);
    await t.hover(
      t.page.locator(".block", { hasText: "Dinner at Snug Harbour" }).first().locator(".block__sub"),
      2400,
    );
    await t.hover(
      t.page.locator(".block", { hasText: "Memorial Park" }).first().locator(".block__sub"),
      2400,
    );
    await t.scroll(900, 1600);
    await t.hover(t.page.locator(".banner--warn[role=alert]").first(), 2600);
    await t.scroll(700, 1400);
    await t.wait(1200);
  },

  /** Food ideas with the Breakfast filter, then a past weekend with its date line. */
  async "mock-food-past"(t) {
    await t.wait(900);
    await t.hover(t.page.getByText("Breakfast", { exact: true }).first(), 2200);
    await t.page.goto(mock("past.html"));
    await t.wait(1200);
    await t.hover(t.page.locator(".card__date").first(), 2600);
  },

  /** Plan a date through D38 and land on the date's screen. */
  async "plan-date"(t) {
    await t.wait(800);
    await t.click(t.page.getByRole("button", { name: "Plan a date" }));
    await t.wait(1400);
    await t.click(dialog(t).getByRole("radio", { name: "Dinner", exact: true }));
    await t.click(dialog(t).getByRole("radio", { name: "Sunday", exact: true }));
    await t.hover(dialog(t).getByRole("checkbox", { name: "Sara", exact: true }), 1200);
    await t.click(dialog(t).getByRole("button", { name: "Plan the date" }));
    await waitForDate(t);
    await t.hover(t.page.locator(".date-care"), 1600);
    await t.hover(t.page.locator(".date-step--meal .block__sub"), 2200);
    await t.hover(t.page.locator(".date-plan .block").last().locator(".block__sub"), 1600);
  },

  /** Sunday's date block on the weekend. */
  async "date-block"(t) {
    await t.wait(800);
    await t.click(t.page.getByRole("tab", { name: "Sunday", exact: true }));
    await t.wait(1200);
    const block = day(t, "Sunday").locator(".block", { hasText: / date at / });
    await t.hover(block.locator(".block__title"), 2200);
    await t.hover(block.locator(".chip").first(), 1400);
    await t.hover(block.locator(".chip").last(), 2200);
    await t.hover(block.getByRole("button", { name: /^Open the date/ }), 2200);
  },

  /** Swap the restaurant (D39), then drop the activity (D40). */
  async "swap-activity"(t) {
    await t.wait(800);
    await t.click(t.page.getByRole("button", { name: /^Swap restaurant/ }));
    await t.wait(1600);
    await t.click(dialog(t).getByRole("button", { name: "Swap restaurant" }));
    await settled(t);
    await t.hover(t.page.locator(".date-step--meal .block__title"), 2200);
    const change = t.page.getByRole("button", { name: /^Change activity/ });
    if (await change.count()) {
      await t.click(change);
      await t.wait(1600);
      await t.click(dialog(t).getByRole("button", { name: "Drop activity" }));
      await settled(t);
    }
    await t.hover(t.page.locator(".date-plan .block").nth(1), 2200);
  },

  /** Move (D41), regenerate (D42) and cancel (D43). */
  async "move-cancel"(t) {
    await t.wait(800);
    await t.click(header(t).getByRole("button", { name: "Move" }));
    await t.wait(1200);
    await t.click(dialog(t).getByRole("radio", { name: "Lunch", exact: true }));
    await t.click(dialog(t).getByRole("radio", { name: "Saturday", exact: true }));
    await t.click(dialog(t).getByRole("button", { name: "Move date" }));
    await settled(t);
    await t.hover(t.page.locator(".page-header__subtitle"), 2200);
    await t.click(header(t).getByRole("button", { name: "Regenerate" }));
    await t.wait(1200);
    await t.click(dialog(t).getByRole("button", { name: "Regenerate date" }));
    await settled(t);
    await t.hover(t.page.locator(".date-step--meal .block__title"), 1800);
    await t.click(header(t).getByRole("button", { name: "Cancel date" }));
    await t.wait(1600);
    await t.click(dialog(t).getByRole("button", { name: "Cancel date" }));
    await waitForPlan(t);
    await t.wait(1800);
  },

  /** The Breakfast filter on Food, then the date line on Past. */
  async "breakfast-past"(t) {
    await t.wait(800);
    await t.click(t.page.getByRole("button", { name: "Breakfast", exact: true }));
    await t.wait(1800);
    await t.hover(t.page.locator(".card--media").first(), 1800);
    await t.click(t.page.getByRole("link", { name: "Past", exact: true }).first());
    await t.wait(1600);
    await t.hover(t.page.locator(".card__date").first(), 2800);
  },
};
