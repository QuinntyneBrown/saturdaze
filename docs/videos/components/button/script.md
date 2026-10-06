# 09 · Coding sd-button: signals, slots and a tooltip

In this video you build the S D button, the one button in the app. Every action, from Plan this weekend to a small icon that swaps a block, is an S D button; the app's templates use it more than eighty times. It can render a real button element or, when you give it an href, an anchor. It supports five variants, three sizes, icon only buttons with a tooltip, toggle buttons with a pressed state, and in app links that go through the router.

## The decorator

Open the button file in the components library. The selector is S D button, the component is standalone, change detection is OnPush, and it imports ng template outlet and the tooltip directive.

The decorator has no host block at all, which makes it different from the earlier components: there is no class on the host. The stylesheet makes the host display contents, so it draws no box of its own. The inner button or anchor is the element with the B E M class B T N, the one the mock draws. That way pixel parity holds, the end to end locators find the primary class on the real button, and the accessible name sits on the element a screen reader focuses, as A D R nine describes.

Nothing else goes on the host either. The variant, the size and the flags used to be mirrored there as attributes, but nothing read them, so they are gone. Inputs stay inputs, and the state shows up where it counts, as classes and A R I A on the inner element, the rule A D R nine records.

## Inputs

The inputs are all signal inputs with typed defaults. The variant is a union of primary, quiet, ghost, danger and text, defaulting to primary. The size is small, medium or large. The type is button, submit or reset, and it defaults to button, not submit, so a button inside a form never submits by accident.

Full, icon, warn text and disabled are flags with the boolean attribute transform, so pages write the bare words. Pressed is a boolean or null; null means this is not a toggle, so no aria pressed attribute is written at all. Label is the accessible name, required for icon only buttons. Tooltip is a string or null, href and target turn the button into a link, and button class adds extra classes to the inner element.

## Derived state with computed

The button has four computed signals. The first, called classes, builds the class list: B T N, the variant modifier, the size modifier unless it is medium, then block, icon and warn text when their flags are on, plus any extra classes. It filters out the empty strings and joins the rest with spaces. One memoised computed replaces six class bindings.

The second, tooltip text, uses the tooltip input if it is set, even to an empty string, and otherwise falls back to the label, but only for icon buttons. So icon buttons get a tooltip for free, and an empty string switches it off.

The third, tooltip relationship, is label for icon buttons and description for text buttons. An icon button is already named by its aria label, so its tooltip must not add a second description; a text button's tooltip adds extra information, so it describes.

The fourth, rel, returns no opener when the target is blank, and null otherwise.

## Inject and the anchor click

The router is injected with the inject function, marked optional, so the button still works in a context with no router, such as a Storybook story or a test without routes.

The anchor click handler does two things. If the button is disabled, it prevents the default and stops: an anchor cannot be truly disabled, so the click is swallowed. Otherwise, if there is a router and no target, it calls a shared helper, navigate in app. That helper only handles a plain primary click on an in app path, preventing the default and navigating with the router. External links and modifier clicks keep their normal browser meaning.

## The template and its slots

Now the most important lesson in this component. The template declares its three slots, leading, default and trailing, exactly once, inside an ng template with a reference called content.

Below it, an if block renders an anchor when there is an href, and a button otherwise. Both branches render the content template with ng template outlet. Why not just put the ng content tags in both branches? Because Angular projects each node into only one ng content. With the slots repeated per branch, the anchor variant would render empty. The comment at the top of the template says exactly that, and the project instructions make it a rule.

Both elements bind the classes, the aria label, aria pressed and the tooltip directive. The anchor adds href, target, rel, aria disabled and the click handler; the button adds type and the native disabled property.

## The styles

The host is display contents. The B T N class sets the layout, a circular radius, and a height from a component knob, dash dash S D button height, with forty pixels as the fallback, so a parent can resize buttons without reaching in. The primary variant uses brand background with neutral foreground on brand; quiet uses neutral background one and neutral stroke one. Disabled buttons, real or aria disabled, are dimmed and ignore pointer events. One exception to watch: the danger variant still sets its text colour as a literal white instead of a token.

## The unit tests

The spec file provides the router and declares a host component with a plain button and a link button, each projecting leading, default and trailing content. Two helpers stand out: click dispatches a cancelable click and reports whether the component prevented it, and tab to simulates keyboard focus so focus visible matches.

The first group checks rendering: the primary, medium default with type button, the mirrored classes, the disabled property on the inner button, pressed as aria pressed only for toggles, and the label as the accessible name.

The anchor group: renders an anchor when href is given, checks the no opener rel. Routes a plain click on an in app href through the router spies on navigate by U R L. Lets external, modifier and targeted clicks keep their browser meaning proves the router is never called for those. Marks a disabled anchor with aria disabled and swallows its click.

Four projection tests render the host component and prove leading, default and trailing content arrive in order in both the button and the anchor. These are the tests that protect the declare slots once rule.

Finally, the tooltip group. Shows the label on an icon only button, hidden from assistive tech. Prefers tooltip text over the label, and an empty tooltip turns it off. And shows nothing on a text button unless asked, then describes it, checking aria described by.

## Pitfalls

A few pitfalls. Never repeat the ng content tags in both branches. Never ship an icon only button without a label. Don't default the type to submit. Don't style the host; style the inner element. And don't open a blank target without no opener.

## Recap

Things to remember.

- A display contents host, with the B T N element inside carrying the classes and the accessible name.
- Typed signal inputs, boolean attribute transforms, and a nullable pressed.
- Four computed signals derive classes, tooltip text, relationship and rel.
- An optional injected router for in app links.
- Slots declared once in an ng template, rendered in both branches.

Next, in video ten, we build the S D card, the surface that groups content across the app.
