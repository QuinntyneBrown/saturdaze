# 42 · Coding sd-spinner: a decorative ring with an optional glyph

The spinner is a rotating ring. On its own it is a small, quiet "something is happening" mark. Give it an icon and it becomes a spinner disc: the same ring with a glyph sitting in its centre. You will build S D spinner from its real source, see how far two inputs and three host bindings can go, and then walk through its spec file.

## Where it is used

The spinner is mostly used through another component. The status row, the next video in this series, renders one spinner disc in front of its message, and every loading state in the app goes through it: the planner's "Working through your locks", the Ideas pages, Past, Family and the review queue. The one direct use in the app is the verify email page, which puts a spinner with the mail icon into the auth card's disc slot while it verifies, next to a visually hidden status message that says the same thing in words.

## The decorator

Open the file called spinner dot T S. The decorator uses the selector S D spinner, standalone, On Push, and imports the icon component, because the glyph is an S D icon.

The host block carries all of the component's logic, and there are three entries.

First, aria hidden is set to true, statically. The spinner is decoration: whoever shows it is responsible for announcing the state in words, which is exactly what the status row's polite live region does.

Second, the class spinner disc is added when the icon is non empty, using a double negation to turn the string into a boolean. Third, the class spinner small is added when the size is small.

That is the whole list. The size and icon inputs are not mirrored back onto the host as attributes. Nothing read them, so, as A D R nine now records, only classes and A R I A state go on the host. The small size already has its modifier class, and the glyph is visible in the rendered icon.

## The inputs

There are two signal inputs, both made with the input function. Size is typed as the union of small and medium, defaulting to medium, so the compiler rejects anything else. Icon is a string, defaulting to empty.

Notice what is not here. There is no computed signal, because each derived value is a one line expression that lives naturally in the host bindings, where Angular already tracks the signals it reads. There is no output, no model and no local state. And there is no effect: nothing has to be synchronised imperatively, because the animation is pure C S S.

## The template

The template is two lines of logic. A span with the class spinner draws the ring. Then an at if on the icon renders S D icon with that name at a size of sixteen. There is no content projection, so there are no slots to worry about.

## The styles

Open spinner dot S C S S. The host is an inline flex box, forty pixels square, centred, that does not shrink, and its colour is brand foreground two, which the icon inherits.

The small modifier on the host shrinks it to twenty pixels.

The ring is absolutely positioned to fill the host, fully rounded, with a three pixel border in neutral stroke one and a top border in brand stroke one. A keyframes rule called S D spin rotates it a full turn, linearly, every point nine seconds, forever. In the small size the border drops to two pixels. Every colour is a token read by role: stroke tokens for the ring, a foreground token for the glyph.

## The spec file

Open spinner dot spec dot T S. The setup imports the spinner and the icon component, creates the spinner with no inputs and detects changes. Above it sit two small helpers. Glyph renders a standalone S D icon with a given name and returns its S V G markup. Drawn returns the S V G markup inside a rendered icon. Comparing the two proves the right glyph is actually drawn, without relying on any attribute.

"creates a decorative ring with no glyph" proves the default: aria hidden is true, the ring span exists, there is no icon and no spinner disc class.

"becomes a spinner disc with the glyph inside when an icon is given" sets the icon to sparkle through the component ref's set input, and checks the disc class, that the drawn glyph matches the sparkle glyph, and that the ring is still there.

And "mirrors the small size to a host class" sets small and checks the class, then sets medium back and checks it is removed. That second half is important: it proves the bindings are reactive in both directions, not just applied once.

## Pitfalls

- Using a spinner as the only loading signal. It is aria hidden, so pair it with text, ideally in a status row.
- Expecting a size other than small or medium. The union type rejects it at compile time.
- Not respecting reduced motion. Unlike the skeleton row, this stylesheet has no reduced motion rule, so keep spinners short lived.

## Recap

Things to remember.

- Two typed signal inputs drive everything.
- Host bindings derive classes directly from signals, no computed needed.
- Inputs stay inputs: only classes and A R I A state go on the host.
- The spinner is decorative: aria hidden, with words supplied by its container.
- The spec proves the bindings both set and clear.

Next, video forty three builds S D stars, a five star rating that is either a display or an editable radio group.
