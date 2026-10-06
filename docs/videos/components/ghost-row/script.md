# 26 · Coding sd-ghost-row: one slot, two elements

In this video you will build S D ghost row, the dashed add row under a list. On the family page it says Add a family member and Add a commitment; on the weekend page it says Add an errand, with a bag icon. In all three it renders a button. Give it an href instead and it renders an in app link. That switch between two elements is why this component is worth studying: it is the cleanest example of the project rule to declare each N G content slot once.

## The decorator and the host

Open ghost row dot T S. The selector is S D ghost row, the component is standalone, and it imports the icon component and N G template outlet from Angular common. Change detection is On Push.

There is no host object at all. The B E M class ghost row goes on the inner anchor or button, and the stylesheet makes the host display contents, so the host adds no box and the real element is what lays out in the list. Icon and href are not mirrored onto host attributes either: inputs stay inputs, as A D R nine records. The href belongs on the real anchor, not on the host.

## Inject, inputs and an output

The first field injects the Angular router with the inject function, marked optional. In the app a router always exists, but in Storybook or a bare test there may be none, and an optional injection keeps the component usable there instead of throwing.

There are two signal inputs. Icon defaults to plus. Href defaults to an empty string, which means render a button. Plain strings with sensible defaults need no transform and no input dot required.

The output is called pressed and emits void. It is created with the output function, and it only fires for the button variant; the anchor variant navigates instead.

There is no computed signal and no local state.

## In app navigation

The one method, on anchor click, runs when the anchor is clicked. If there is a router, it calls a shared helper called navigate in app with the router, the click event and the href.

That helper lives in the shared in app link file and is used by the button component too. It only intercepts a plain primary click: no modifier keys, the main mouse button, and an event nobody has already prevented. It also only handles absolute, same origin paths that start with a single slash. When both are true it prevents the browser's default and asks the router to navigate by URL. Everything else falls through to the browser, so copy link, middle click and new tabs keep working.

## The template: one content template

Open ghost row dot H T M L. It starts with a comment pointing to the button component's template for the reasoning, and then an N G template with the reference name content. Inside it are an S D icon, bound to the icon signal at sixteen pixels, and a single default N G content.

Then an if block on href. When href is set, it renders an anchor with the ghost row class, the href attribute, and the click handler. Otherwise it renders a button with the ghost row class, type button, and a click that emits pressed. Each branch contains only an N G container with N G template outlet pointing at content.

Here is why this matters. Angular projects each N G content into exactly one place, decided at compile time. If you wrote the icon and the N G content twice, once in each branch, the consumer's text would only ever land in one of them, and the other variant would render empty. Putting the slot in one template, and stamping that template into whichever branch is active, keeps the slot declared once and working in both. The button and list item use the same pattern.

## Styles

Open ghost row dot S C S S. The host is display contents. The ghost row class is a full width centred flex row, at least forty four pixels high for a comfortable touch target, with a one pixel dashed border in neutral stroke one and border radius medium. Text uses font size base three hundred, semibold weight and neutral foreground two, on a transparent background.

Colours transition with duration fast and curve easy ease, and on devices that can hover, the hover rule fills the row with neutral background three and darkens the text to neutral foreground one.

## The spec file

The spec file has a host component that renders a ghost row with the user icon and the text Add a family member. The test bed provides the router with provide router and an empty route list, creates the component and runs detect changes.

Creates a dashed add button with a plus glyph checks the default: a button of type button, the plus glyph actually drawn, and no anchor. Forwards the icon name sets the icon with fixture dot component ref dot set input and checks that the user glyph is drawn. Emits pressed when the button is clicked subscribes to the output and clicks.

The most interesting test is renders an in app anchor when href is given and routes plain clicks. It spies on the router's navigate by URL, sets href to slash family slash new, checks that an anchor replaced the button, then dispatches a cancelable click event. It expects the router to have been called with that path and the event's default to be prevented.

Projects the row text after the glyph renders the host component and checks the text and that the icon comes first, which proves the shared template projects correctly.

## Pitfalls

- Never repeat N G content in each branch of an if; use one N G template and N G template outlet.
- Don't intercept modifier clicks or external links; let the browser handle them.
- Inject the router as optional so the component works without one.
- Keep the host as display contents; the inner element is the row.

## Recap

Things to remember.

- One content template, stamped into either an anchor or a button.
- An optional injected router and a shared helper give real links with in app navigation.
- The pressed output fires only for the button variant.
- No host bindings and no computed state are needed; inputs stay inputs.
- Tokens by role, a dashed border, and a forty four pixel touch target.

Next, in video twenty seven, we build S D icon, the single source of truth for every glyph in the app.
