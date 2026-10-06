# 52 · Coding sd-well: the quiet note block, and the end of the series

S D well is the quiet note block: a soft rounded box with a small leading icon, an optional bold first line, and a body of text. It is how Saturdaze explains itself. When you open a block on the weekend, the block dialog shows a well titled "Why this" with the planner's reason, and a lock icon well when the block is locked or is a recurring commitment. The confirm dialog and the add to day dialog use wells too, and the legal pages put "The short version" in one. In this final video of the series you will build it from its real source, see a content slot declared once and an aliased input, and read its spec.

## The decorator

Open well dot T S. The file exports a type called well tone: default, accent, warn or primary.

The selector is S D well, standalone, On Push, and it imports the icon component. The host object follows the pattern you have now seen many times. The static class well is the B E M block from the mocks. Three class bindings add a modifier for accent, warn and primary; default has no modifier, because the base class is the default look. That is the whole host. Neither the tone nor the title is mirrored onto the host as an attribute. Inputs stay inputs: only classes and ARIA state go on a host, as A D R nine records. The title shows why. Mirroring it would put a native title attribute on the well, and browsers show that as a hover tooltip the mocks never had.

## Three signal inputs, one alias

Icon is a string defaulting to sparkle. Tone is a well tone defaulting to default.

The third input is the interesting one. In templates it is called title, which is the natural word: S D well title equals "Why this". Inside the class it is called well title, through the alias option. The alias keeps the public attribute short and familiar, while the class property name says exactly what it is and stays clearly separate from the native title attribute it is named after.

There is no computed signal, no output and no local state. A well displays what it is given, and the host bindings and template read the inputs directly. With On Push and signal inputs, that is all the reactivity it needs.

## The template and the content slot

The template is short. First an S D icon, bound to the icon input, at sixteen pixels. Then a div with the class well text. Inside it, an at if renders a paragraph with the class well title only when well title is non empty. And below it, a div with the class well body that holds a single, unnamed N G content.

That one N G content is the body slot, and it is declared exactly once, unconditionally. The project rule matters here: content projection is decided when the template is compiled, so a slot repeated inside different at if branches only ever projects into one of them. Keeping the slot outside any condition means the body always appears, title or no title. Consumers simply write their text between the tags, as the block dialog does with the planner's reason.

## The styles

The host is the well: a flex row with a ten pixel gap, items aligned to the top, twelve by fourteen pixels of padding, border radius medium, neutral background three, and neutral foreground one text. The icon is fixed size, nudged down three pixels to line up with the first line of text, and coloured neutral foreground two.

Each tone swaps both the background and the icon colour, in fill and ink pairs. Accent uses status success background one, with status success foreground one on the icon. Warn uses status danger background one and status danger foreground one. Primary uses brand background two and brand foreground two. Because each pair is designed together, contrast is correct by construction.

The title is semibold at font size base four hundred. The body is neutral foreground two at base three hundred. And an adjacent sibling selector adds two pixels between title and body only when a title exists, so a body on its own is not pushed down. All of this is encapsulated, so the element selector for S D icon only matches the icon inside the well.

## The spec

Open well dot spec dot T S. It declares a small host component whose template is an S D well with a title of "Why this", the sun icon, and a sentence about sunny weather as content. The setup imports the well, the host and the icon component, then creates the well itself, runs detect changes, and keeps the host element. Two small helpers at the top compare icons by what they draw: glyph renders an S D icon by name and returns its S V G markup, and drawn reads the markup inside a rendered icon.

"Creates a plain well with a leading sparkle" checks the defaults: the well class, the sparkle glyph actually drawn, no title paragraph, and the body inside the text wrapper.

"Mirrors the tone to a host class" loops over accent, warn and primary with set input and checks the modifier class.

"Renders the bold first line from title" sets the input by its public name, title, which proves the alias works, then checks the rendered paragraph.

"Forwards the icon name" sets the icon to lock and checks that the lock glyph is drawn, rather than reading an attribute.

And "projects the body under the title" creates the host component instead, because projection can only be tested from a real parent template. It checks the title, the projected body text inside the well body, and the sun glyph.

## Pitfalls

- Don't bind the title input onto the host as an attribute. A host title attribute is a native hover tooltip; keep the title an input that renders a paragraph.
- Don't wrap the content slot in a condition; declare it once.
- Pick the tone for meaning, success, danger or brand, not for colour alone.

## Recap

Things to remember.

- Signal inputs, an alias for a natural public name, and host bindings.
- The default tone maps to no modifier; inputs never become host attributes.
- One unconditional N G content slot for the body.
- Tones swap fill and ink pairs together.
- Test projection through a host component.

That brings the series to a close. Across fifty two components you have seen the same few ideas again and again: signal inputs and computed state, outputs instead of mutation, host bindings that keep B E M parity with the mocks, accessible state in real attributes, tokens by role, and specs that prove behaviour. Use them in the next component you write.
