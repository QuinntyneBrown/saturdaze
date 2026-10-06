# 49 · Coding sdTooltip: a directive, an overlay and a tiny panel

The tooltip is a short hint for a control, shown on hover and on keyboard focus. In Saturdaze it comes in two parts: an attribute directive called S D tooltip, which you put on the trigger, and a tiny component, the tooltip panel, which is the bubble. Most of the app never touches the directive directly. S D button applies it for you: an icon only button shows its label as a tooltip, and a text button can pass a tooltip input, as the weekend page does with "Swap for something else". In this video you will build both parts, following the Fluent UI version nine tooltip behaviour, and then read the spec, which leans on fake timers.

## The panel component

Start with tooltip panel dot T S, because it is the simplest. The selector is S D tooltip, it is standalone and On Push, and its template is just the text signal in double curly braces. The host gets the class tooltip, the role tooltip, an id bound to the tooltip id input, and aria hidden set to true only when the hidden input is true.

It has three signal inputs: text, tooltip id, and hidden, which uses the boolean attribute transform. The doc comment says it is internal to the directive.

Its stylesheet makes the bubble: at most two hundred and forty pixels wide, inverse colours so it reads over any card, a short fade in, and no animation when the user prefers reduced motion. Every value is a Fluent token read by role, as A D R thirteen asks: the neutral inverted background for the bubble, the neutral inverted foreground for its text, a sixteen shadow, and the fast duration with the easy ease curve. No hex values and no older dash dash S D names from the mock era.

## The directive and its timing rules

Now open tooltip dot T S. Above the class are three constants with comments that explain each number. Show delay is four hundred milliseconds before the first tooltip. Hide delay is one hundred milliseconds, a grace period so the pointer can move onto the bubble, which is the W C A G hoverable rule. And warm is six hundred milliseconds: a tooltip shown within that time after another hid skips the delay. Then a positions table, top or bottom, each with a fallback to the opposite side. Two module level variables, next id and last hidden at, are shared by every tooltip on the page; that is what makes the warm window work across buttons.

The directive's selector is S D tooltip in square brackets, standalone, exported as S D tooltip so a template can grab it with a reference. The host object listens to five events: pointer enter, pointer leave, pointer down, focus in and focus out.

## Injection and inputs

Three dependencies come from inject: the C D K overlay service, the host element ref, and the document.

Three signal inputs, each aliased so the attribute names read naturally. Text is aliased to S D tooltip. Placement, top or bottom, defaults to top. Relationship, label or description, defaults to description. The private state is plain fields, not signals, because nothing renders them: the id, the overlay ref, the panel's component ref, and two timer handles.

## The one effect

The constructor holds one effect, with a comment: keep an open bubble in step with its trigger, Lock to Unlock. It reads the text signal. If no panel is open it returns. If the text became empty it hides; otherwise it sets the panel's text input and runs detect changes on the panel. This is a legitimate effect: it pushes signal state into a component that lives outside this view, in the overlay.

## Showing and hiding

On pointer enter returns at once for touch, because tooltips never show on touch. It cancels any pending hide, and if the bubble isn't visible, it either shows immediately inside the warm window or starts the show timer. On focus shows only when the host matches focus visible, so a mouse click, which also focuses the button, does not pop a tooltip.

Show bails out when there is no text, when it is already visible, or when the host is disabled. It lazily creates the overlay with a flexible connected position strategy, the positions for the current placement, an eight pixel viewport margin, and a scroll strategy that closes on scroll. Then it attaches a component portal for the panel, sets the three inputs, and runs detect changes at once, so the description exists before a screen reader reads focus. It adds pointer listeners to the bubble so it stays open while hovered, adds a capturing keydown listener on the document, and, for the description relationship, adds its id to aria described by.

Hide clears both timers, detaches the overlay, records last hidden at, removes the keydown listener, and removes its id. The Escape handler stops propagation, so one Escape closes the hint but not the dialog behind it. And N G on destroy hides and disposes the overlay.

The relationship is the accessibility core. For an icon only button, the name already lives in aria label, so the bubble is hidden from assistive technology and nothing is read twice.

## The spec

Open tooltip dot spec dot T S. The host component is a button with the directive bound to a text signal and a relationship signal, plus an existing aria described by of hint. Two helpers stand in for the browser: pointer dispatches a mouse event carrying a pointer type, because J S DOM has no pointer event constructor, and tab to dispatches a Tab keydown before focusing, so focus visible matches. The bubble helper queries the document, because the overlay renders outside the fixture.

The setup turns on V I fake timers and moves the system clock ten seconds ahead, to step past the warm window left by the previous test.

The pointer tests: "shows after a hover delay and hides on pointer-out" advances four hundred and then one hundred milliseconds. "Stays open while the pointer moves onto the bubble". "Skips the delay for the next tooltip right after one hides". And "never shows for touch".

The keyboard tests: "shows at once on keyboard focus and hides on blur", and "dismisses on Escape and on press".

The accessibility tests: "adds itself to aria-describedby while shown, keeping existing ids", and "as a label, hides the bubble from assistive tech and leaves aria-describedby alone".

And the text tests: "follows text changes while open and closes when the text clears", and "does nothing without text".

## Pitfalls

- Don't put the tooltip on a disabled button and expect it to show; show checks for disabled.
- Don't use the description relationship on an icon only button, or the name is read twice.
- Never put essential information only in a tooltip; touch users never see it.

## Recap

Things to remember.

- A directive owns the behaviour; a tiny On Push panel renders the text.
- The C D K overlay positions the bubble; never hand roll it.
- Aliased signal inputs, inject for dependencies, plain fields for private state.
- One effect keeps an open bubble in sync with its text.
- Label versus description decides what assistive technology hears.

Next, in video fifty, we build S D top bar, the sticky desktop navigation.
