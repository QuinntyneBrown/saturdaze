// Screen recordings for video 44, Meet Saturdaze (tools/video-record/record-clips.mjs), against
// the family app and an API on a disposable, freshly seeded database
// (tools/video-record/family-demo/README.md). The seeded Browns family is the one on camera;
// setup plans this weekend and two past weekends so every screen has something to show.

export const config = {
  baseURL: process.env.SD_APP_URL ?? "http://localhost:4200",
  apiURL: process.env.SD_API_URL ?? "http://localhost:5100",
  viewport: { width: 1408, height: 792 },
};

const EMAIL = process.env.SD_DEMO_EMAIL ?? "quinntynebrown@gmail.com";
const day = (t, name) =>
  t.page
    .locator(".day")
    .filter({ has: t.page.locator(".day__title", { hasText: name }) });

/** This weekend, plus two rated past weekends for the Past screen (idempotent). */
async function stage(t) {
  const api = (path) => `${config.apiURL}${path}`;
  const login = await t.page.request.post(api("/api/auth/login"), {
    data: { email: EMAIL, password: "password123" },
  });
  const headers = {
    Authorization: `Bearer ${(await login.json()).token.accessToken}`,
  };
  await t.page.request.get(api("/api/weekends/current"), { headers });
  for (const weekendOf of ["2026-10-17", "2026-10-10"]) {
    await t.page.request.post(api("/api/weekends/plan"), {
      headers,
      data: { weekendOf },
    });
  }
  const history = await (
    await t.page.request.get(api("/api/weekends/history"), { headers })
  ).json();
  const [last, before] = history;
  if (last && !last.rating) {
    await t.page.request.put(api(`/api/weekends/${last.id}/rating`), {
      headers,
      data: { rating: 5 },
    });
    await t.page.request.put(api(`/api/weekends/${last.id}/favourite`), {
      headers,
      data: { favourite: true },
    });
    await t.page.request.put(api(`/api/weekends/${last.id}/title`), {
      headers,
      data: { title: "Zoo day and lavender" },
    });
  }
  if (before && !before.rating)
    await t.page.request.put(api(`/api/weekends/${before.id}/rating`), {
      headers,
      data: { rating: 4 },
    });
}

// Each clip's first page loads off camera, so the recording opens on a painted screen.
export const setup = {
  async "the-weekend"(t) {
    await stage(t);
    await t.signIn(EMAIL);
    await t.go("/weekend");
  },
  async anchors(t) {
    await t.signIn(EMAIL);
    await t.go("/family");
  },
  async ideas(t) {
    await t.signIn(EMAIL);
    await t.go("/ideas");
  },
  async "make-it-yours"(t) {
    await t.signIn(EMAIL);
    await t.go("/weekend");
  },
  async "share-and-past"(t) {
    await t.signIn(EMAIL);
    await t.go("/weekend");
  },
};

export const clips = {
  /** The Weekend screen: the cover, then Saturday's timeline and map, then Sunday. */
  async "the-weekend"(t) {
    await t.wait(1200);
    await t.scroll(560, 1400);
    await t.hover(day(t, "Saturday").locator(".block").first(), 1600);
    await t.hover(t.page.locator(".leg").first(), 1400);
    await t.hover(t.page.locator(".block__disc--num").first(), 1400);
    await t.click(t.page.getByRole("tab", { name: "Sunday", exact: true }));
    await t.wait(1600);
    await t.hover(day(t, "Sunday").locator(".block").first(), 1600);
  },

  /** The Family screen: who's in, then the commitments locked into every weekend. */
  async anchors(t) {
    await t.wait(1000);
    await t.hover(
      t.page.getByText("Ages shape the picks. Tap a person to edit."),
      1500,
    );
    await t.hover(t.page.getByText("Eli", { exact: true }), 1200);
    await t.hover(t.page.getByText("Mae", { exact: true }), 1200);
    await t.scroll(520, 1300);
    await t.hover(t.page.getByText("Swim lessons", { exact: true }), 1500);
    await t.hover(t.page.getByText("Church", { exact: true }), 1800);
  },

  /** Ideas: an activity card with its drive time, then the Food and Events segments. */
  async ideas(t) {
    await t.wait(1000);
    await t.hover(
      t.page.locator(".card--media").first().locator(".chip").first(),
      1500,
    );
    await t.hover(
      t.page
        .getByRole("button", { name: /Add .* to (the )?day|Add to day/ })
        .first(),
      1500,
    );
    await t.click(t.page.getByRole("link", { name: "Food", exact: true }));
    await t.wait(1800);
    await t.click(t.page.getByRole("link", { name: "Events", exact: true }));
    await t.wait(2000);
  },

  /** Swap a stop on Saturday, then lock the day. */
  async "make-it-yours"(t) {
    await t.wait(800);
    await t.scroll(560, 1200);
    const swap = day(t, "Saturday").locator('[aria-label^="Swap "]').first();
    await t.hover(
      swap.locator('xpath=ancestor::*[contains(@class,"block")][1]'),
      1200,
    );
    await t.click(swap);
    await t.wait(2600);
    const lock = day(t, "Saturday").locator(
      ".day__actions button[aria-pressed]",
    );
    await t.click(lock);
    await t.wait(2200);
  },

  /**
   * Share this weekend, then the Past screen with its rated weekends. The share dialog stays
   * closed: against a local API its link reads localhost, which does not belong in a brand video.
   */
  async "share-and-past"(t) {
    await t.wait(800);
    await t.hover(
      t.page.getByRole("button", { name: "Share", exact: true }),
      2200,
    );
    await t.click(
      t.page.getByRole("link", { name: "Past", exact: true }).first(),
    );
    await t.wait(1500);
    await t.hover(t.page.getByText("Zoo day and lavender"), 1800);
    await t.hover(t.page.getByText("5 of 5").first(), 1400);
    await t.hover(t.page.getByRole("button", { name: /Repeat/ }).first(), 1600);
  },
};
