# 44 · Coding sd-status-row: a polite live region with a spinner

The status row is the card that says what the app is doing while you wait: a spinner disc on the left and a short sentence on the right, like "Working through your locks, the forecast and past weekends." It is a tiny component that composes the spinner from the previous video and adds the one thing the spinner deliberately lacks: words that a screen reader will announce. You will build S D status row from its real source, then walk through its spec file.

## Where it is used

Search the app and you will find a status row on almost every page that loads data. The Weekend page shows one with the sparkle icon while the planner is generating. The Ideas pages use sparkle, ticket and fork, for activities, events and food. The Past page uses the star icon, Family uses the user icon, and the review submissions page uses ticket. Each one passes an icon and projects a sentence as content.

## The decorator

Open the file called status row dot T S. The decorator uses the selector S D status row, standalone, On Push, and imports the spinner component.

The host block has three static entries. The class called status row puts the mock's block class on the host. Role is set to status, and aria live is set to polite. Together they make the host a live region: when its text changes, assistive technology announces the new text, but politely, after whatever the user is currently hearing, rather than interrupting.

Notice that these are plain static host attributes, not bindings. They never change, so there is no signal to read, and Angular writes them once.

## The input

The class has one signal input, icon, made with the input function, defaulting to sparkle. A sensible default means the most common case, the planner, needs nothing extra. There is no output, model or local state, and nothing to derive.

## The template

The template is two lines. First, S D spinner with its icon input bound to the status row's icon signal. Passing a non empty icon is what turns the spinner into a spinner disc, the ring with a glyph inside, and the spinner itself stays aria hidden.

Second, a span with the class status row text that contains the default N G content. That is the only slot, declared once, with no condition around it, so the message always projects.

This split is the accessibility design. The spinner is decoration, hidden from assistive technology. The projected text is the message, and it lives inside the live region on the host.

## The styles

Open status row dot S C S S. The host is a flex row, centred, with a fourteen pixel gap and padding of fourteen by sixteen pixels. It is a card: neutral background one, a one pixel border in neutral stroke two, and border radius large. The text is fourteen pixels in neutral foreground two, and the row keeps a twenty four pixel bottom margin from whatever follows.

The text span sets a min width of zero, so a long sentence can wrap inside the flex row instead of pushing it wider. Every colour and radius is a token read by role.

## The spec file

Open status row dot spec dot T S. It declares a small host component whose template is a status row with the refresh icon and the message "Working through your locks." The setup configures the testing module with both, plus the icon component, creates the status row on its own, and detects changes. Above them sit two helpers borrowed from the spinner spec: glyph renders a standalone S D icon and returns its S V G markup, and drawn returns the markup inside a rendered icon.

"creates a polite live status region" checks the status row class, role status and aria live polite. That one test guards the whole accessibility contract.

"shows a spinner disc with the sparkle glyph by default" finds the inner spinner and checks it has the spinner disc class and that the icon inside it draws the sparkle glyph. Since the spinner no longer mirrors its icon onto the host as an attribute, the test checks what is actually drawn.

"forwards the icon to the spinner" sets the icon to refresh through the component ref's set input and checks the spinner now draws the refresh glyph.

And "projects the message into the text span" creates the host component and checks the text span holds the message, and that the spinner draws the refresh glyph set in the host template.

## Pitfalls

- Rendering the status row only after the text is ready. Many screen readers only announce changes to a live region that is already on the page, so keep the row mounted and change its content when you can.
- Putting interactive content inside it. A status region is for short messages, not buttons.
- Using it for errors that need attention. Those belong in a banner with role alert.

## Recap

Things to remember.

- Static host attributes make the host a polite live region.
- One input with a sensible default; nothing else.
- The spinner is decoration; the projected text is the message.
- One default slot, declared once, never conditional.
- The spec guards the role, the default glyph, forwarding and projection.

Next, video forty five builds S D strength, the three segment password strength meter.
