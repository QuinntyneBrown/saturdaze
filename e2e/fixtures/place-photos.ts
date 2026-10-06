import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Page } from "@playwright/test";

/**
 * Place photos for the Ideas screens (L2-100). The bundled seed carries no photos
 * (production sources are still to be chosen), so specs that need them rewrite the
 * catalog responses in flight and serve the image bytes from the mock placeholders.
 *
 * Each place is assigned, by its position in the response, one of:
 *   "photo"   — a primary photo that loads
 *   "none"    — no photo (photo: null)
 *   "broken"  — a photo whose image request fails (404)
 */
export const PHOTO_HOST = "https://images.example.com";

export type PhotoPlan = "photo" | "none" | "broken";

const PLACEHOLDER = readFileSync(join(__dirname, "../../docs/mocks/images/lavender-farm.svg"));

export function photoAlt(name: string): string {
  return `Photo alt for ${name}`;
}

export function photoCredit(name: string): string {
  return `Photo · ${name} credit`;
}

function planFor(index: number, plans: readonly PhotoPlan[]): PhotoPlan {
  return plans[index % plans.length];
}

/** Rewrites `GET /api/{catalog}` so places carry photos per `plans`, and serves the images. */
export async function stubPlacePhotos(
  page: Page,
  catalog: "activities" | "restaurants" | "events",
  plans: readonly PhotoPlan[] = ["photo", "none", "broken"],
): Promise<void> {
  await page.route(`${PHOTO_HOST}/**`, (route) =>
    route.request().url().includes("/broken-")
      ? route.fulfill({ status: 404, body: "" })
      : route.fulfill({ status: 200, contentType: "image/svg+xml", body: PLACEHOLDER }),
  );
  await page.route(new RegExp(`/api/${catalog}(\\?|$)`), async (route) => {
    const response = await route.fetch();
    const places = (await response.json()) as { name: string; photo?: unknown }[];
    const rewritten = places.map((place, i) => {
      const plan = planFor(i, plans);
      if (plan === "none") return { ...place, photo: null };
      const slug = place.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return {
        ...place,
        photo: {
          url: `${PHOTO_HOST}/${plan === "broken" ? "broken-" : ""}${slug}.svg`,
          width: 1600,
          height: 900,
          alt: photoAlt(place.name),
          attribution: photoCredit(place.name),
        },
      };
    });
    await route.fulfill({ response, json: rewritten });
  });
}
