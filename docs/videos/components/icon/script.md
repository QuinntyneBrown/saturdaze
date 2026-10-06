# 27 · Coding sd-icon: one source of truth for every glyph

In this video you will build S D icon, the component behind every glyph in Saturdaze. It appears ninety nine times across fifty templates in the app and the component library: in buttons, chips, discs, dialogs, the bottom navigation and the star rating. It draws an inline S V G from a fixed set of forty stroke glyphs, with no network requests, and because the stroke uses current colour it recolours with its parent. It also uses one A P I you must handle carefully: the D O M sanitizer.

## The glyph map

Open icon dot T S. Before the component, the file declares a constant record from glyph name to S V G markup: sun, cloud, rain, lock, calendar, heart, star, sparkle, check and the rest. The doc comment says it mirrors the sprite in the mock's app script, the same forty glyphs, inline.

Right after it, the file exports icon names, a read only array built from the record's keys. Galleries and tests use it instead of a second list.

## The decorator and host bindings

The selector is S D icon, the component is standalone, it has no imports, and change detection is On Push.

The host object has two bindings. The first is a class binding: icon filled, the mock's own modifier class, is on whenever the filled signal is true.

Notice that name, size and filled are not mirrored onto host attributes. Inputs stay inputs. The one piece of state the stylesheet needs, filled, becomes a host class, and nothing else ever read those attributes. A D R nine records that rule for the whole library.

The second is a style binding to a custom property called underscore size, with the pixel unit, bound to the size signal. The leading underscore marks it as a private knob: the stylesheet reads it, but it is not part of the public A P I like an S D prefixed variable would be.

## Inputs, inject and computed

The class injects the D O M sanitizer with the inject function.

There are four signal inputs. Name defaults to sparkle. Size is a number that defaults to twenty. Filled is a boolean with the boolean attribute transform, so the stars and the favourite heart can bind it, and a story can write the bare attribute. Stroke is a number that defaults to one point seven; its doc comment says chips use two at thirteen pixels.

Notice that size and stroke don't use the number attribute transform. Consumers always bind them with square brackets, for example size bound to thirteen, so they receive real numbers. With strict templates on, writing size equals sixteen as a plain string attribute would be a type error, which pushes consumers toward the binding. Adding the number attribute transform would allow the string form; this component chose not to.

The derived state is a protected computed signal called path. It looks up the name in the glyph map, falls back to sparkle when the name is unknown, and passes the markup through the sanitizer's bypass security trust H T M L.

Pause on that, because bypassing the sanitizer is normally a red flag. It is safe here for one reason: the markup only ever comes from the constant map in this file. The name input can only choose a key; it can never inject markup, because an unknown key falls back to sparkle. If you ever change this component to accept S V G from outside, from an input, an A P I or a C M S, that bypass becomes a cross site scripting hole.

## The template

The template is one S V G element with the class icon. It has a twenty four by twenty four view box, aria hidden true and focusable false, so it is always decorative and never a tab stop. Fill is none and stroke is current colour, with round line caps and joins. The stroke width attribute is bound to the stroke signal, and inner H T M L is bound to the path signal.

Because the icon is always hidden from assistive technology, meaning must come from somewhere else. That is why icon only buttons in this library take a label input, like the dialog's close button.

## Styles

Open icon dot S C S S. The host is an inline flex box with a line height of zero and flex none, so it never squashes or adds stray space below the glyph. The S V G's width and height read the underscore size custom property, with twenty pixels as the fallback.

When the host has the icon filled class, the S V G switches to fill current colour and no stroke, which turns the outline star into a solid one.

Parents can also set the underscore size knob themselves. The filter chip does exactly that, setting it to fourteen pixels for every icon inside a chip.

## The spec file

The spec file creates the component with TestBed and runs detect changes.

Creates and renders a decorative inline svg checks the S V G: aria hidden true, focusable false, stroke current colour and the view box. Exposes the sprite names checks that icon names has forty entries and contains sparkle, home, star, user, lock and check.

Renders name, size and filled through the glyph, size variable and host class checks the defaults: the sparkle path data, no icon filled class, and an underscore size of twenty pixels. Then it sets all three with fixture dot component ref dot set input and checks the check glyph, the class, and fourteen pixels. It asserts what is rendered, not attributes. Accepts the attribute form of filled sets filled to an empty string and expects the icon filled class, which proves the boolean attribute transform.

Draws the named glyph sets check and looks for its path data. Falls back to the sparkle glyph for an unknown name captures the sparkle markup, sets a name that does not exist, and expects the same markup. Forwards the stroke weight to the svg checks one point seven, then two.

## Pitfalls

- Never feed external markup into this component; the sanitizer bypass is only safe for the constant map.
- Don't rely on an icon for meaning; it is aria hidden, so label the control.
- Bind size and stroke with square brackets so they arrive as numbers.
- Add a new glyph to the map, and the spec's count will remind you to update it.

## Recap

Things to remember.

- One constant map is the single source of truth, and icon names is derived from it.
- A computed signal looks up, falls back and sanitizes the glyph.
- The sanitizer bypass is safe only because the markup is constant.
- A private underscore size custom property is set from the host and read by the stylesheet.
- Every icon is decorative, recolours with current colour, and fills on demand through the icon filled host class.

Next, in video twenty eight, we build S D leg, the travel leg between two blocks on the weekend timeline.
