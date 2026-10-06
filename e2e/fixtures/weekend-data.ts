import { Page } from "@playwright/test";

type Block = { day: string; stop?: unknown; stopNumber?: number | null; legBefore?: unknown };
type Day = { day: string; stopCount: number; drivingMinutes: number; drivingKm: number };

/**
 * Rewrites the weekend responses so `day` has no stops away from home: no stop
 * snapshots, numbers or legs (L2-091 AC2's "home day").
 */
export async function stubHomeDay(page: Page, day: "Saturday" | "Sunday"): Promise<void> {
  await page.route(/\/api\/weekends\/(current|plan)(\?|$)/, async (route) => {
    const response = await route.fetch();
    const weekend = (await response.json()) as { blocks: Block[]; days?: Day[] };
    weekend.blocks = weekend.blocks.map((b) =>
      b.day === day ? { ...b, stop: null, stopNumber: null, legBefore: null } : b,
    );
    weekend.days = (weekend.days ?? []).map((d) =>
      d.day === day ? { ...d, stopCount: 0, drivingMinutes: 0, drivingKm: 0 } : d,
    );
    await route.fulfill({ response, json: weekend });
  });
}

/** "1 h 36 min" / "51 min" — how the day meta states a driving total. */
export function drivingLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
