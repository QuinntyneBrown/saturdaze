import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Page } from "@playwright/test";
import { API_URL } from "./auth.js";

/**
 * Photo suggestions (L2-157 to L2-160). The API would ask Claude and fetch
 * the web; here `POST /api/photo-suggestions` answers from a script and the
 * signed previews it names are served from a placeholder. The "use" routes
 * record what the dialogs sent and answer with the cover, photo or user the
 * real API would return.
 */
const PLACEHOLDER = readFileSync(join(__dirname, "../../docs/mocks/images/lavender-farm.svg"));

export interface SuggestionScript {
  readonly id: string;
  readonly title: string;
  readonly sourceName: string;
  readonly attribution: string;
  readonly licence?: string;
}

export const TWO_SUGGESTIONS: readonly SuggestionScript[] = [
  { id: "s1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", title: "Lavender rows", sourceName: "Wikimedia Commons", attribution: "Photo · Terre Bleu Lavender Farm", licence: "CC BY-SA 4.0" },
  { id: "s2bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", title: "Farm at dusk", sourceName: "Terre Bleu", attribution: "Photo · Terre Bleu", licence: "Official site" },
];

export interface SuggestionStub {
  /** Bodies of every `POST /api/photo-suggestions`. */
  readonly searches: Record<string, unknown>[];
  /** Bodies of every `POST …/suggestion` (the "use" routes). */
  readonly uses: Record<string, unknown>[];
  /** Change what the next search answers with. */
  answer: SuggestionScript[] | "error";
}

function previewUrl(id: string): string {
  return `${API_URL}/api/photo-suggestions/${id}?exp=4102444800&sig=stub`;
}

export async function stubPhotoSuggestions(
  page: Page,
  answer: SuggestionScript[] | "error" = [...TWO_SUGGESTIONS],
): Promise<SuggestionStub> {
  const stub: SuggestionStub = { searches: [], uses: [], answer };

  await page.route(/\/api\/photo-suggestions\/[0-9a-z]+(\?|$)/, (route) =>
    route.fulfill({ status: 200, contentType: "image/svg+xml", body: PLACEHOLDER }),
  );
  await page.route(/\/api\/photo-suggestions$/, async (route) => {
    stub.searches.push(route.request().postDataJSON() as Record<string, unknown>);
    if (stub.answer === "error") {
      return route.fulfill({
        status: 503,
        contentType: "application/problem+json",
        body: JSON.stringify({ status: 503, title: "Service unavailable", code: "suggestions_unavailable" }),
      });
    }
    const suggestions = stub.answer.map((s) => ({
      id: s.id,
      previewUrl: `/api/photo-suggestions/${s.id}?exp=4102444800&sig=stub`,
      width: 1600,
      height: 900,
      title: s.title,
      sourceName: s.sourceName,
      sourceUrl: `https://example.org/${s.id}`,
      attribution: s.attribution,
      licence: s.licence ?? "CC BY 4.0",
    }));
    await route.fulfill({ json: { suggestions } });
  });
  return stub;
}

/**
 * Answers `POST /api/admin/places/{kind}/{id}/photos/suggestion` with a curated photo
 * (L2-159) and adds that photo to the place's next photo listings, as the real
 * API would after storing it.
 */
export async function stubUseSuggestedCuratedPhoto(page: Page, stub: SuggestionStub): Promise<void> {
  const added: Record<string, unknown>[] = [];
  await page.route(/\/api\/admin\/places\/[^/]+\/[^/]+\/photos\/suggestion$/, async (route) => {
    const body = route.request().postDataJSON() as { suggestionId: string; alt: string; attribution: string; licence: string };
    stub.uses.push(body);
    const chosen = (stub.answer === "error" ? TWO_SUGGESTIONS : stub.answer).find((s) => s.id === body.suggestionId)!;
    const photo = {
      id: `p-${chosen.id}`,
      url: `https://images.example.com/api/catalog-photos/${chosen.id}.jpg`,
      width: 1600,
      height: 900,
      alt: body.alt,
      attribution: body.attribution,
      license: body.licence,
      source: "Curated",
      isPrimary: added.length === 0,
      reviewState: "Reviewed",
      adminLocked: true,
      updatedAt: new Date().toISOString(),
      updatedBy: null,
      blocked: false,
    };
    added.push(photo);
    await route.fulfill({ status: 201, json: photo });
  });
  await page.route(/\/api\/admin\/places\/[^/]+\/[^/]+\/photos$/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const response = await route.fetch();
    const place = (await response.json()) as { photos: Record<string, unknown>[] };
    await route.fulfill({ response, json: { ...place, photos: [...added, ...place.photos] } });
  });
}

/** Answers `POST /api/auth/me/avatar/suggestion` with the user wearing the suggested photo (L2-160). */
export async function stubUseSuggestedAvatar(page: Page, stub: SuggestionStub): Promise<void> {
  await page.route(/\/api\/auth\/me\/avatar\/suggestion$/, async (route) => {
    const body = route.request().postDataJSON() as { suggestionId: string };
    stub.uses.push(body);
    const me = await route.fetch({ url: `${API_URL}/api/auth/me`, method: "GET", postData: undefined });
    const user = (await me.json()) as Record<string, unknown>;
    await route.fulfill({ json: { ...user, avatarUrl: `/api/photo-suggestions/${body.suggestionId}?exp=4102444800&sig=avatar` } });
  });
}

/** Answers `POST /api/weekends/{id}/cover/suggestion` with the current weekend wearing the suggested cover (L2-158). */
export async function stubUseSuggestedCover(page: Page, stub: SuggestionStub): Promise<void> {
  await page.route(/\/api\/weekends\/[^/]+\/cover\/suggestion$/, async (route) => {
    const body = route.request().postDataJSON() as { suggestionId: string };
    stub.uses.push(body);
    const chosen = (stub.answer === "error" ? TWO_SUGGESTIONS : stub.answer).find((s) => s.id === body.suggestionId)!;
    const current = await route.fetch({ url: `${API_URL}/api/weekends/current`, method: "GET", postData: undefined });
    const weekend = (await current.json()) as Record<string, unknown>;
    weekend["cover"] = {
      url: previewUrl(chosen.id),
      width: 1600,
      height: 900,
      alt: "A photo of this weekend from the web",
      attribution: chosen.attribution,
      label: "From the web",
      source: "upload",
      placeId: null,
    };
    await route.fulfill({ json: weekend });
  });
}
