# 47 · Couples dates: the frontend and tests

> **Runtime:** ~5.8 min · **Audience:** frontend developers and anyone writing Playwright tests here · **Prerequisites:** videos 45 and 46; Angular signals and CDK Dialog basics

**Video:** [47-couples-date-the-frontend.mp4](47-couples-date-the-frontend.mp4) · [Slides](slides.html) · **Audio:** [47-couples-date-the-frontend.mp3](47-couples-date-the-frontend.mp3) · [Transcript](script.md)

Last of three videos on couples date planning (L1-042, ADR-025). Narrated with the free Kokoro voice from Hugging Face, no captions, a soca bed from Pixabay under it.

## Why this video exists

The frontend half of the build follows every house rule at once: contract plus token in the api library, projections instead of formatting in templates, dialogs for every edit, a route under an existing navigation item, and Playwright through page objects. This video shows each rule applied to one feature.

## Learning objectives

By the end, the viewer can:

- Find the date DTO, view, projections, contract and token in `frontend/projects/api/`
- Explain how `weekend-projection.ts` renders a `Date` block and why it is neither swappable nor lockable
- Follow "Plan a date" from `WeekendPage.planDate()` through `PlanDateDialog` to `/weekend/dates/:id`
- Read `DatePage.change()` and the dialogs behind D39–D43
- Write an e2e test for the date through the `DatePage` and `WeekendPage` page objects

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Where is a refusal shown, and in whose words? | `DateRefusal` carries the server's message; the Weekend page's warn banner or the date page's warn alert shows it |
| Why is the date's screen under the Weekend item? | A date is part of a weekend; the four-item navigation is fixed (ADR-005, ADR-025) |
| How does a test plan a date without touching the DOM? | `dateFamily()` makes a throwaway family through the API; `WeekendPage.planDateButton()`, `dialogOption()`, `dialogAction()` |
| Why does the Past test stub the history response? | A past weekend cannot get a date (this weekend or next only) |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/api/src/lib/models/couple-date.dto.ts`, `couple-date-view.ts` | The two shapes |
| `frontend/projects/api/src/lib/api/couple-date-projection.ts` | `compactRange`, `andList`, `pastDateLine` |
| `frontend/projects/api/src/lib/services/date.service.contract.ts` | `IDateService`, `DateRefusal`, `DATE_SERVICE` |
| `frontend/projects/api/src/lib/api/weekend-projection.ts` | The `Date` block: icon, subtitle, chips, `lockable` |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.ts` | `planDate()`, `openDate()` |
| `frontend/projects/saturdaze/src/app/dialogs/plan-date-dialog/` | D38 / D38b |
| `frontend/projects/saturdaze/src/app/app.routes.ts`, `pages/date/date.page.ts` | The route and `change()` |
| `frontend/projects/components/src/lib/past-card/past-card.html` | The date line |
| `e2e/pages/date.page.ts`, `e2e/tests/couple-date.spec.ts`, `e2e/fixtures/couple-date.ts` | Page object, spec, fixture |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00–00:22 | Introduction | What the video covers |
| 00:22–01:50 | The API library | DTO and view, projections, contract and token, the `Date` block |
| 01:50–02:33 | The Weekend page | `planDate()`, `PlanDateDialog` |
| 02:33–03:33 | The date's screen | The route, the page, `change()` and the dialogs |
| 03:33–03:56 | Food and Past | Breakfast filter, `sd-past-card` dates |
| 03:56–05:15 | The tests | Page objects, the six e2e tests, the projection specs |
| 05:15–05:45 | Recap | Things to remember |

## Demo commands

```powershell
cd frontend; npx ng test api --watch=false
pwsh -File eng/Start-E2eApi.ps1 -Build; cd frontend; npm start
cd e2e; npx playwright test tests/couple-date.spec.ts --project=chromium

$env:PYTHON = "python"; node tools/video-audio/generate-audio.mjs docs/videos/47-couples-date-the-frontend --engine kokoro
node tools/video-build/build-video.mjs docs/videos/47-couples-date-the-frontend --no-captions --music docs/videos/assets/music/en-la-playa-trinidad-and-tobago-soca.mp3
```

## Pitfalls

- Pages inject `DATE_SERVICE`, never `DateService`; the token is provided in `app.config.ts`.
- Below 720px the step rows hide their action buttons; the chevron opens the same dialog, and the page object's `.or()` locator covers both.
- Never put a selector in a spec; add it to the page object.

## References

- `docs/adr/ADR-025-couples-date-planning.md`, `docs/adr/ADR-005-bottom-nav-device-chrome-clearance.md`, `docs/adr/ADR-009-*`
- `docs/detailed-designs/weekend-planning/plan-a-couples-date/README.md`
- [Angular CDK Dialog](https://material.angular.io/cdk/dialog/overview) · [Playwright page object model](https://playwright.dev/docs/pom)
- Music: "En La Playa - Trinidad and Tobago Soca" by JuliusH, [Pixabay](https://pixabay.com/music/world-en-la-playa-trinidad-and-tobago-soca-4662/), Pixabay Content License
- Voice: Kokoro-82M, [hexgrad/Kokoro-82M on Hugging Face](https://huggingface.co/hexgrad/Kokoro-82M), via `kokoro-onnx`
