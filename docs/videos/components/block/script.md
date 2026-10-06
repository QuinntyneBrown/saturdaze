# 06 · Coding sd-block: host listeners, two outputs and a timeline row

In this video you build the S D block, one row of a day's timeline. Each block shows a time and an optional duration on the left, a rail with a small disc in the middle, and a title, a one line subtitle and chips on the right. On phones a chevron opens the details dialog; from tablet width, action buttons appear on hover or focus. The Weekend page renders one block per stop, the shared weekend page renders them read only, and the landing page shows a few inside its browser frame miniature. This is the richest component so far: six boolean flags, two outputs, host event listeners and a little focus logic.

## The decorator

Open the block file in the components library. The selector is S D block, the component is standalone, change detection is OnPush, and it imports the icon component.

The host block does a lot. The class is block, the mock's block class, and the role is listitem, because the day renders its blocks inside a list. Then six class bindings add the modifiers: commitment, locked, drive, errand, done and active, each one reading its boolean signal.

Next comes the tab index. When the block has a stop number, the host gets a tab index of minus one. That makes the row focusable from code, so the map can move focus to it when you pick its pin, without adding it to the tab order. Otherwise the binding returns null and there is no tab index at all.

Then four event listeners on the host. Mouse enter and focus in emit the active change output with true. Mouse leave emits false. Focus out calls a method named focus left, which you will see in a moment. Declaring listeners in the host block keeps every host concern in one place.

And that is the whole host block. It used to also mirror the time, the title and every flag back onto the element as attributes. Those bindings are gone, and the title shows why. A title attribute on the host is a native browser tooltip, so every row in the timeline grew a tooltip the mock never had, and the template needed a workaround to hide it. Nothing read the other attributes either. So the rule, now recorded in A D R nine, is simple: inputs stay inputs, and only classes and A R I A state go on the host.

## Inputs and outputs

The inputs are all signal inputs. Time, duration and subtitle are strings. The icon defaults to sparkle. The title uses an alias again: pages write title, the class reads block title. Commitment, locked, drive, errand and done each use the boolean attribute transform, and so does readonly, which hides the phone chevron on the shared view.

Stop number is a number or null, and null means the row is not a numbered stop. Active is another boolean, set by the page when the row's map pin is highlighted.

There are two outputs, both created with the output function. Details is a void output, fired by the chevron. Active change is a boolean output, fired by the host listeners. Notice the split: the page owns the active state and passes it back down through the active input. The block only reports what happened. One source of truth, owned by the page.

## Focus left

Now the one method. Focus out fires when focus leaves any element inside the row, including when it just moves from one action button to the next. So the method checks whether the related target, the element receiving focus, is still inside the host. Only if focus has really left the row does it emit false. Without this check, tabbing between the row's buttons would flicker the map highlight off and on.

## The template

The template follows the mock's anatomy. The time column shows the clock, and the duration only inside an if block. The rail shows either a numbered disc or an icon disc. The numbered disc has an aria label of stop and the number, so a screen reader hears stop two rather than a bare digit. The icon is sixteen pixels, or thirteen on a drive row.

The body has an h3 for the title, the subtitle in an if block, and the chips slot. The actions region holds the actions slot, and it is a plain div. It used to carry an empty title attribute, with a comment, to stop the row's reflected title tooltip doubling the buttons' own tooltips. With no title on the host, that workaround is gone. Each slot is declared once.

Last is the chevron button, rendered only when the row is not a drive and not read only. It has type button, an aria label of details for and the title, and its click emits the details output.

## The styles

The host is a four column grid: time, rail, body and actions, with tokens read by role. Commitment and locked rows tint the disc with the status success pair; errands use the palette indoor pair. Drive rows are compact.

From the tablet breakpoint, via the respond to mixin, the chevron disappears and the actions show on hover or focus within. A focus visible outline uses the stroke focus two token, so the programmatic focus is visible.

## The unit tests

The spec creates the block, sets a title and a time with set input on the component ref, and keeps a helper that finds the chevron. A host component projects one chip and one action button.

Creates a timeline row with time, rail and title checks the defaults, including the listitem role and the sparkle glyph actually drawn in the disc. Renders duration, subtitle and the icon checks the optional parts, the fork glyph, and the icon's sixteen pixel size.

Mirrors every modifier to a host class loops over commitment, locked, errand and done, turning each on and off, and proves the class is added and removed. Notice the tests assert rendered output, classes, roles, text and glyphs, never a reflected attribute.

Offers a chevron that names the row and emits details checks the type, the aria label and the icon, then subscribes a spy to the details output and clicks. Is compact with a smaller glyph and no chevron for drive rows, and hides the chevron in the read only shared view, cover the two ways the chevron disappears.

Projects chips into the body and actions into their own region proves both slots.

Be honest about the gaps: the stop number, the active input, the active change output and the focus left logic have no test in this spec. Before you change them, write the test first.

## Pitfalls

A few pitfalls. Don't put the row in the tab order with a tab index of zero; minus one is enough for programmatic focus. Don't emit false on every focus out without checking the related target. Don't keep the active state inside the block; let the page own it. And don't reflect the title back onto the host, or the native tooltip returns.

## Recap

Things to remember.

- The host is the list item, with one class binding per flag.
- Host listeners emit active change; the page owns the active state.
- Focus left checks the related target before emitting false.
- Two outputs, details and active change, created with the output function.
- Slots declared once, and an aria label on the numbered stop.

Next, in video seven, we build the S D bottom nav, and see why its bottom offset must never be simplified.
