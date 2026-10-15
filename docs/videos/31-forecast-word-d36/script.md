# 31 · Design drift D36: the forecast, in words

Every day on the Weekend page starts with a little round weather icon. A sun for a nice day, a cloud for a grey one. For a lot of people that icon is the whole forecast. For anyone using a screen reader, it is nothing at all. This short video covers drift D36 from the design-system drift log: what drifted, why it matters, the fix in the mocks and the app, and the real page before and after. Recorded as of October 2026.

## What drifted

A day header has a weather disc, then the day name, then a meta line with the date, the temperatures, the number of stops and the driving time. The disc is hidden from assistive technology, because it is decoration. But on a day with stops, nothing else said what the weather would be. The word sunny appeared nowhere. Only a day with no stops got a weather note, like light breeze, good for outdoors. The design system had already chosen the fix: put a weather word in the day meta line.

## Why it matters

The relevant criteria are WCAG one point one point one, non-text content, and one point four point one, use of colour. A sun or a cloud, drawn in a colour, is the only thing telling someone it will rain on the day of the picnic. A person who cannot see the icon, or cannot tell its colour, loses the forecast. The words cost one short word in a line that already exists.

## The fix in code

This is a change in what the page says, so the requirement came first. L2 one thirty five says a day header writes the forecast as one plain word before the temperatures: Sunny, Cloudy, Rain, Snow, Warm or Cold. When the forecast is unavailable, the word and the temperatures are left out, as before.

Then the mocks. The weekend, landing and generating pages, and the design system's examples, all read seventeen May, Sunny, twenty two over fourteen degrees, three stops, and so on.

In the app, the change is one line in the weekend projection. The function that builds the day meta already had a helper that turns forecast tags into a capitalised word, `weatherWordCapitalised`. It simply was not being used there. Now it is pushed into the meta before the temperatures. The unit test for the header meta failed first, because the text had no weather word, and passes now.

The acceptance test is a Playwright test through the weekend page object. For each day it selects the tab, then expects the meta line to match the date, a weather word, the temperatures, the stops and the driving time. It failed because the page showed the temperatures with no word. Finally the landing page's sample weekend, the stories and the perf scenario use the same line, and the D36 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is the Weekend page for the demo family, and the forecast this weekend is snow. Under the day name, the meta line gives the date, then the temperatures, then the stops and the driving time. There is no word for the weather. The snowflake icon beside the day name is the only thing that carries the forecast, and it is hidden from a screen reader.

And here is the fix. The same page, the same day. The meta line now says the weather in a word, Snow, right after the date and before the temperatures. A screen reader reads it, and so does anyone who cannot make out the icon. Switching to Sunday shows the same pattern, with the word for that day.

## Recap

Things to remember.

- A decorative icon cannot be the only carrier of the forecast.
- The day meta line names the weather first: Sunny, Cloudy, Rain, Snow, Warm or Cold.
- Reuse the helper that already exists, `weatherWordCapitalised`, rather than writing a new one.
- Requirement and mock first, a failing test, then delete the drift record.
