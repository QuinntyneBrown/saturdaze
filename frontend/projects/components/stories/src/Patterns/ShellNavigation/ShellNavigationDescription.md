One responsive shell for every signed-in screen (ADR-009). The app renders `sd-top-bar`, a single `<main class="sd-frame">` with the router outlet, and `sd-bottom-nav` — **both** bars are always in the DOM and CSS picks one:

| Width | Chrome |
| --- | --- |
| below 720px | floating `sd-bottom-nav` pill; `.sd-frame` pads its bottom by the nav height + safe-area inset (ADR-005) |
| 720px and up | sticky `sd-top-bar` with the wordmark, the four links and the account avatar |

Both bars take the same `active` key (`weekend` · `ideas` · `past` · `family`) from route `data.nav`, so the four destinations stay identical across breakpoints. Public pages use the lighter `sd-sitebar` (`data.shell: 'site'`) and auth pages use no chrome (`'bare'`).

Switch the toolbar viewport between **Mobile**, **Tablet** and **Desktop** on any story to watch the handoff.
