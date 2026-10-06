# 30 · Coding sd-list-item: one row, three elements, slots declared once

The S D list item component is one row of an S D list. It looks simple, a title, a subtitle, maybe an avatar and a chevron, but it hides the most important template pattern in the library. Depending on its inputs, the row is a plain div, an in app link, or a button, and its projected content has to land in whichever one renders. In this video you will build it step by step from its real source, see how one template and an outlet keep the slots in one place, and walk through all six of its unit tests.

## Where it is used

The app renders list items in nine places. On the Family screen, each family member is an action row with a chevron, a title, a subtitle, an avatar in the leading slot, and a pressed handler that opens the edit dialog. On the Weekend screen, rows take an href and a chevron, with a disc in the leading slot, and navigate. In the errand added dialog, rows use subtitle first, so a small label like "What" or "When" sits above the value.

## Step one: the decorator

Create the list item file. The selector is S D list item, it is standalone, OnPush, and it imports two things: the N G template outlet directive and the Icon component.

The host has the role list item, so it fits directly inside the list's role list. And that is the whole host object.

Notice that none of the inputs is mirrored onto the host as an attribute. A title attribute on the host would make the browser show a native tooltip on every row, which the mocks never have, and nothing in the styles or the page objects reads such attributes anyway. A D R nine records the rule: inputs stay inputs, and only the mock's classes and aria state go on the host.

## Step two: inputs, an output and inject

Now the class. First, a private router, obtained with the inject function, and marked optional. Optional means the row still renders in Storybook or a test with no router.

The inputs. Row title is a string input aliased to title. The alias matters: a class field called title would collide with the native title property on elements, so the class uses row title, and templates still write title. Subtitle and href are plain strings. Subtitle first, action and chevron are booleans with the boolean attribute transform, so the bare attribute works in templates. Label is an optional accessible name override.

There is one output, pressed, created with the output function and typed void. It emits when an action row is clicked.

And one protected method, on anchor click. If there is a router, it calls the shared navigate in app helper with the event and the href. That helper only intercepts plain primary clicks on in app paths that start with a single slash. Everything else keeps its normal browser meaning, and the anchor keeps a real href.

Notice there is no computed signal here. Every branch reads an input directly, so there is nothing to derive.

## Step three: one template, three branches

This is the pattern to learn. The row's body is defined once, inside an N G template with a template reference called body. In it: the leading slot, selected by slot equals leading. Then the text column with the class list text. Inside that, the subtitle when subtitle first is set, then the title, then the subtitle in the normal position, then a default ng content for any extra content. Finally the trail span with the trailing slot and, if chevron is set, an S D icon named chevron right.

Below the template, an if block chooses the element. When href is set, it renders an anchor with the list item and list item action classes, the href, an aria label from the label input or null, and the click handler. Else, if action is set, a button of type button with the same classes, which emits pressed on click. Otherwise, a plain div with just the list item class. Each branch renders the body with N G template outlet.

Why not just repeat the slots in each branch? Because projection is resolved at compile time, and each projected node lands in only one slot. Copies in the other branches stay empty. The project instructions call this out: declare each ng content slot once.

## Step four: the styles

The host is display block. The row is a three column grid: auto for the leading slot, a flexible text column, and auto for the trail, with a fifty six pixel minimum height. Its horizontal padding reads S D list pad x, the knob the list sets to sixteen pixels in card mode. A has selector collapses the first column when there is no leading content, and the trail hides itself when it is empty.

The last row drops its bottom border, and action rows get a neutral background three highlight only on devices that can hover. Titles and subtitles use font size and foreground tokens by role.

## Unit tests

The spec file uses provide router with an empty route list, and a host component that projects a leading span, an extra em element and a trailing span into a row with title, subtitle and chevron.

"Creates a static list item row" proves the defaults: role list item, a div row without the action class, no title, subtitle or chevron, and no anchor or button inside.

"Renders title and subtitle" sets both inputs with set input and checks the rendered text in the title and subtitle spans.

"Adds the trailing chevron glyph" checks what is actually drawn: the icon's S V G inside the trail contains the chevron's path.

"Becomes a button that emits pressed when action is set" checks the tag, the button type, the action class and the aria label, then subscribes a spy to pressed, clicks, and expects one call.

"Becomes an in app anchor when href is set and routes plain clicks" spies on the router's navigate by U R L, sets href and action together, and proves that href wins: the row is an anchor and there is no button. Then it dispatches a cancelable click and checks that the router was called and the default was prevented.

Finally, "projects leading, default and trailing content into the row" renders the host component and proves every slot landed in the right place. This is the test that would fail if someone duplicated the slots per branch.

## Pitfalls

- Repeating ng content in each branch; projected content silently disappears.
- Naming the input field title without an alias.
- A click handler on a static row instead of action or href.
- Putting a toggle in the trailing slot of an action row; nested interactive controls are unreachable.

## Recap

Things to remember.

- One body template, rendered by N G template outlet in a div, anchor or button branch.
- Boolean attribute transforms for the flags, an alias for title, and an output for pressed.
- Optional inject of the router, and plain clicks routed in app.
- The row reads the list's padding knob and tokens by role.
- Six tests cover defaults, text, chevron, button, anchor and slots.

Next, in video thirty one, we build S D media, the photo frame with a fallback tile.
