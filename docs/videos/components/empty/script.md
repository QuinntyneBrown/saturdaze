# 21 · Coding sd-empty: an empty state with a call to action

In this video you will build S D empty, the centred card Saturdaze shows when there is nothing to list yet. It has an extra large disc, a title, an optional body, a call to action row with an optional note, and room for extra content below. The weekend page uses its warm variant when no weekend is planned, with a primary Plan this weekend button and the note, Or wait for Friday at six P M. The past, review submissions and shared weekend pages use it too.

## The decorator and host bindings

Open empty dot T S. The selector is S D empty, the component is standalone, it imports the disc component from the previous video, and change detection is On Push.

The host object adds the class empty, the B E M block from the mock stylesheet, as A D R nine requires. A class binding adds the modifier empty warm when the warm signal is true. The title and warm inputs are not mirrored back onto host attributes: only classes and ARIA state go on the host, as A D R nine now records. A reflected title would even give the card a native browser tooltip. The one attribute binding is ARIA: the host's aria labelled by points at the heading's id, so the card is named by its own title.

## Inputs

There are six signal inputs, all created with the input function. The title input is aliased: consumers write title, and the class property is called empty title. The default is Nothing here yet, so even an empty state with no configuration still says something sensible.

Body and note are optional strings that default to empty, and the template only renders them when they are set. Icon defaults to sparkle. Tone reuses the disc tone type exported by the disc component, so the empty state cannot accept a tone the disc doesn't support.

Warm is a boolean input with the boolean attribute transform. In the weekend page template you will see the bare attribute warm, with no value. Without the transform, that bare attribute would arrive as an empty string; with it, it arrives as true.

Notice what this component doesn't need. There is no computed signal, because nothing is derived beyond simple conditions the template can read directly. There is no output, because the call to action is projected content: the consumer's own button handles its own click.

## A heading id from a counter

The last field is a protected heading id, built from a module level counter, so every instance gets a unique id like S D empty zero, S D empty one, and so on. It is a plain constant, not a signal, because it never changes after construction. The template binds it to the heading's id and the host binds it to aria labelled by.

## The template and its slots

The template starts with an S D disc, bound to the icon and tone signals, with the size fixed to extra large. Then comes the H two with the empty title class, showing the title signal.

The body paragraph sits inside an if block, so it only appears when the body signal is not empty. Then the call to action row: it projects anything marked with the slot attribute C T A, and after it, again inside an if block, the faint note. Finally, a default N G content projects everything else below the card's action row.

Each slot is declared exactly once.

## Styles

Open empty dot S C S S. The host is the card: a centred flex column with a twelve pixel gap and a maximum width of four hundred and eighty pixels. Its colours are tokens by role: neutral background one for the fill, neutral stroke two for the border, and border radius extra large for the corners.

The warm modifier widens the card to five hundred and sixty pixels and layers the brand background gradient token over the neutral background, just like the mock's warm gradient.

The title uses font size base six hundred and the bold font weight. The body uses neutral foreground two, and the note uses the fainter neutral foreground three with font size base two hundred. One detail worth copying: the call to action row hides itself when it has no children, using the has selector, so an empty state without buttons doesn't leave a gap.

## The spec file

The spec file has a small host component with a title, a note, a button in the C T A slot, and an extra paragraph. The main block creates the component with TestBed and runs detect changes.

Creates a labelled empty state with a default title checks the default heading, that the host's aria labelled by matches its id, and that body, note and the warm class are absent.

Draws an extra large disc with the given icon and tone checks the rendered disc: the sparkle glyph and the extra large class. Then it sets icon and tone with fixture dot component ref dot set input and checks that the glyph changes and the primary tone class appears. Renders title, body and note sets all three and checks the text, including that the note lives inside the call to action row. Mirrors the warm first run variant checks the class.

Projects the C T A into the action row and the rest below renders the host component and proves the button lands in the call to action row, while the extra paragraph is a direct child of the host, not inside the row.

## Pitfalls

- Don't add an output for the call to action; project a button into the C T A slot instead.
- Don't forget the boolean attribute transform on boolean inputs, or the bare attribute arrives as an empty string.
- Don't repeat the C T A slot in conditional branches.

## Recap

Things to remember.

- S D empty composes S D disc and reuses its tone type.
- An aliased input keeps the public attribute title.
- The boolean attribute transform makes the bare warm attribute work.
- A counter based id names the card through aria labelled by.
- Two slots, each declared once, and tokens by role.

Next, in video twenty two, we build S D event card, the card that shows a local event on the ideas page.
