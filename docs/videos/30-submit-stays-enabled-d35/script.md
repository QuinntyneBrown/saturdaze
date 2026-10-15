# 30 · Design drift D35: a button that tells you what is missing

A grey button that will not press tells you nothing. Is the form broken? Is a field missing? Which one? This short video covers drift D35 from the design-system drift log: what drifted, why it matters, the fix in the mocks and the app, and the real dialogs before and after. Recorded as of October 2026.

## What drifted

Two dialogs disabled their main button until the form was valid. In Suggest an event, the button was a generic Submit, greyed out until a title and a start time were filled in. In Add a family member, Add member stayed greyed out until a name and an age were filled in. The design system had already decided the opposite: the button stays enabled, pressing it shows an error summary, and the label names the action, like Send suggestion.

## Why it matters

A disabled button is skipped by the Tab key, so a keyboard user never reaches it and never learns what is missing. A screen reader may not announce it at all. And a sighted person on a phone gets no hint, just a button that does nothing. The relevant criteria are WCAG three point three point one, error identification, three point three point three, error suggestion, and four point one point three, status messages. Naming the action matters too: nobody plans a weekend by submitting.

## The fix in code

This is a behaviour change, so the requirement came first. L2 one thirty four says the primary action stays enabled, and that pressing it with a gap shows an alert titled with the count, One thing to fix or Two things to fix, with a link per problem. The link moves focus to the field, and each line leaves as its field is fixed.

Then the mock. The mocks get an error summary style, and the two specimens show enabled buttons: Send suggestion and Add member.

In the app there is a new component, `sd-error-summary`, with a story and a perf scenario like every other component. It is an alert with tabindex minus one, and it emits an event when a line is followed. The text input gains a `focus` method so the dialog can send focus to the right field.

In each dialog, one signal records that a press was attempted. A computed list of problems is derived from the field values once that signal is set, so lines disappear on their own as people type. Pressing the button sets the signal and focuses the summary. The acceptance tests came first: each pressed the button with the field empty and failed because the button was disabled. Edit mode keeps its Save gating, because its drift records are separate. Finally the D35 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is Suggest an event. The dialog opens, and we scroll down to the main button. It says Submit, and it is washed out, because the title is empty. Nothing on screen says why, and pressing it does nothing at all.

In Add a family member, Add member is greyed out the same way. The name and the age are empty, and the button simply refuses to work. There is no hint about which field it is waiting for.

And here is the fix. Same dialog, same empty title, and the button now reads Send suggestion and it is enabled. We press it. The dialog stays open and scrolls back up, and an alert says One thing to fix, with a link that goes to the Title field. The field itself is outlined in red, with its own message.

In Add a family member, pressing Add member lists the name and the age. The alert says Two things to fix, one line for each, and both fields are marked. Type a name, and the first line goes away.

## Recap

Things to remember.

- A disabled primary action cannot say what is missing; keep it enabled.
- On a failed press, show an error summary, move focus to it, and link each line to its field.
- Derive the problem list from the field values, so lines clear as people fix them.
- Label the button with the action: Send suggestion, Add member.
