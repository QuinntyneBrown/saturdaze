# 42 · Design drift D47: four small gaps in the product

> **Runtime:** ~4.7 min · **Audience:** contributors to the components · **Prerequisites:** videos 02, 03 and 37

**Video:** [42-a11y-gaps-d47.mp4](42-a11y-gaps-d47.mp4) · [Slides](slides.html) · **Audio:** [42-a11y-gaps-d47.mp3](42-a11y-gaps-d47.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D47 (issue 85) is about the product, not a mock: `sd-admin-nav` put `aria-label="Admin"` on a host with no role (no landmark); `sd-text-input` hid the hint during an error but kept it in `aria-describedby`; `sd-chip-input` dropped duplicates silently; and a bare `href="#main"` skip link resolves against `<base href="/">`. The design system noted them for the product backlog; this change closes three and confirms the fourth (L2-140).

## Learning objectives

By the end, the viewer can:

- Explain why an `aria-label` needs a role to make a landmark, and why `aria-describedby` must name only elements in the page.
- Describe the chip input's duplicate behaviour: the draft stays, invalid, with a message that clears on edit.
- Say why the skip link needed no change.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 1.3.1 Info and Relationships, 3.3.1 Error Identification, 4.1.2 Name, Role, Value. |
| Why no skip-link change? | `sd-skip-link` prevents the `<base href>` navigation and focuses the target; `tests/skip-link.spec.ts` covers it. |
| Where does the duplicate wording come from? | The design system's chip-input page: "{value} is already in {label}." |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-140. |
| `frontend/projects/components/src/lib/admin-nav/admin-nav.ts` | `role: 'navigation'`. |
| `frontend/projects/components/src/lib/text-input/text-input.ts` | `describedBy`. |
| `frontend/projects/components/src/lib/chip-input/chip-input.ts` | The duplicate branch of `commit()`. |
| `e2e/tests/admin/landmarks.spec.ts`, `ideas-events.spec.ts`, `family.spec.ts` | The three acceptance tests. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:24 | Introduction | What the video covers. |
| 00:24-01:05 | What drifted | Four gaps. |
| 01:05-01:43 | Why it matters | 1.3.1, 3.3.1, 4.1.2. |
| 01:43-03:18 | The fix | Requirement, three changes, tests. |
| 03:18-04:20 | Before and after | Duplicate like, field description, Admin tree. |
| 04:20-04:43 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
cd e2e && npx playwright test tests/ideas-events.spec.ts tests/family.spec.ts --project=desktop -g "describes itself|already there"
cd e2e && npx playwright test tests/admin/landmarks.spec.ts --project=admin
# clips: development builds of both apps on main and the fix (:4401-:4404), API on :5100
node tools/video-record/record-clips.mjs docs/videos/42-a11y-gaps-d47
```

## Pitfalls

- A `has:` filter cannot take a locator that starts at the dialog; scope the chip error by its field label.
- Keep the draft on a duplicate so the person can fix it; clearing it is the silent drop this change removes.

## References

- [WCAG 2.2 Understanding 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)
- ADR-014 in `docs/adr/`.
