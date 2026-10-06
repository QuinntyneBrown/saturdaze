import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Page } from "@playwright/test";

/**
 * Weekend covers (L2-096). The bundled seed has no photos, so these stubs give
 * the weekend's first Saturday and Sunday activities a photo, set the cover to
 * Saturday's, and answer `PUT …/cover` from the same data.
 */
const PLACEHOLDER = readFileSync(join(__dirname, "../../docs/mocks/images/lavender-farm.svg"));
export const COVER_HOST = "https://images.example.com";

type Photo = { url: string; width: number; height: number; alt: string; attribution: string };
type Block = { day: string; kind: string; refId: string | null; title: string; photo?: Photo | null };
type Weekend = { blocks: Block[]; cover?: unknown };

function photoFor(title: string): Photo {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return { url: `${COVER_HOST}/${slug}.svg`, width: 1600, height: 900, alt: `Photo of ${title}`, attribution: `Photo · ${title}` };
}

function coverOf(block: Block, source: string) {
  return { ...block.photo!, label: `From ${block.title}`, source, placeId: block.refId };
}

export interface CoverStub {
  /** Titles of the stops given photos (Saturday's first, then Sunday's). */
  readonly stops: string[];
  /** The body of the last `PUT …/cover`. */
  lastPut: unknown;
}

export async function stubWeekendCover(page: Page, opts: { cover?: boolean } = {}): Promise<CoverStub> {
  const stub: CoverStub = { stops: [], lastPut: null };
  let current: Weekend | null = null;

  await page.route(`${COVER_HOST}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "image/svg+xml", body: PLACEHOLDER }),
  );
  await page.route(/\/api\/weekends\/(current|plan)(\?|$)/, async (route) => {
    const response = await route.fetch();
    const weekend = (await response.json()) as Weekend;
    const picks = ["Saturday", "Sunday"]
      .map((day) => weekend.blocks.find((b) => b.day === day && b.kind === "Activity" && b.refId))
      .filter((b): b is Block => !!b);
    for (const b of picks) b.photo = photoFor(b.title);
    stub.stops.splice(0, stub.stops.length, ...picks.map((b) => b.title));
    weekend.cover = opts.cover === false || picks.length === 0 ? null : coverOf(picks[0]!, "default");
    current = weekend;
    await route.fulfill({ response, json: weekend });
  });
  await page.route(/\/api\/weekends\/[^/]+\/cover$/, async (route) => {
    const body = route.request().postDataJSON() as { source: string; placeId?: string };
    stub.lastPut = body;
    const chosen = current!.blocks.find((b) => b.refId === body.placeId && b.photo);
    const weekend = { ...current!, cover: chosen ? coverOf(chosen, "stop") : current!.cover };
    current = weekend;
    await route.fulfill({ json: weekend });
  });
  return stub;
}
