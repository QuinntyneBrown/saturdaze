The Weekend screen — the product's home. A page header (title, forecast summary, More · Add to calendar · Share) over `.sd-grid-days`: **Saturday | Sunday** side by side from 1024px, stacked below. Each `sd-day` has a weather disc, its meta line and the two day actions (Regenerate, Lock day), then a timeline of `sd-block` rows and an "Add an errand" ghost row.

Block variants come from the plan: **commitments** (`commitment`, accent rail, no swap), **drives** (`drive`, compact, no actions), **errands** (`errand`, mark-done check), and anything the family pinned (`locked`, unlock button pressed). Chips in `[slot=chips]` carry the reason ("Day highlight", "45 min drive"); ghost icon buttons in `[slot=actions]` give Why this · Swap · Lock.

Before there is a plan the screen shows a warm `sd-empty` with the one coral "Plan this weekend" button and what the planner will respect; while the planner runs, the header actions disable and each day shows skeleton rows under an `sd-status-row`.

Composition mirrors `docs/mocks/pages/weekend.html`, `weekend.empty.html` and `weekend.generating.html`.
