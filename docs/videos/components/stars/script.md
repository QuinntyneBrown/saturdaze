# 43 · Coding sd-stars: a rating that displays or edits

The stars component draws five stars. In display mode it fills them up to a rating and can show a short caption, like five of five. In editable mode the same five stars become a radio group of buttons: press one to rate, and press the current star again to clear the rating. You will build S D stars from its real source, then walk through its spec file.

## Where it is used

The past card, on the Past page, shows a display row of stars with a caption, inside the card's rate button. Pressing that button opens the rating dialog, and the dialog renders large, editable stars: it binds rating to its own signal and sets that signal from the rating change event.

## The decorator

Open the file called stars dot T S. The decorator uses the selector S D stars, standalone, On Push, and imports the icon component, because every star is an S D icon.

The host block does a lot. It adds the class called stars, plus a large modifier when the size is large. Rating and editable are not mirrored onto the host as attributes: nothing read them, so, as A D R nine now records, only classes and A R I A state go on the host. Then the accessibility switch: when editable, the host gets role radio group and an aria label from the group label input; in display mode both are removed.

## Inputs and the output

There are five signal inputs, all made with the input function. Rating is a number defaulting to zero. Label is the display caption. Size is the union of medium and large. Editable uses the boolean attribute transform, so the dialog can write the bare word editable. And group label defaults to the word Rating, so the radio group always has an accessible name.

Then one output, made with the output function, called rating change, emitting a number.

Here is the best practice to notice. The input is called rating and the output is called rating change. Because the output name is the input name plus Change, a parent can use the banana in a box syntax on rating, exactly as if it were a model. So why not use model? Because the component never needs to change its own rating. It only asks the parent to. The parent stays the single owner of the value, which is what the rating dialog wants. Reach for model when the component must also write the value itself.

## Derived state and methods

Steps is a plain read only array, one to five. It never changes, so it doesn't need to be a signal.

Icon size is a computed signal: twenty four when the size is large, eighteen otherwise. It is cached, and only recalculates when the size changes.

The pick method emits the step, unless the step equals the current rating, in which case it emits zero. That is the press again to clear behaviour. Star label returns one star for the first step, and the number followed by stars for the rest, so each button has a proper accessible name.

## The template

The template branches on editable. In editable mode, an at for loop over the steps renders a button for each, with the class stars button, type button, role radio, aria checked when the step equals the rating, and the aria label from star label. Clicking calls pick. Inside each button is an S D icon named star, with the computed icon size, filled when the step is less than or equal to the rating.

In display mode, the same loop renders just the icons, with no buttons, followed, behind an at if, by the caption span with the class stars label. The caption is deliberately absent in editable mode.

Notice that aria checked is only true for the exact rating, not for every filled star. Visually several stars are filled, but only one radio is checked, which is what a screen reader should announce.

## The styles

Open stars dot S C S S. The host is an inline flex row with a two pixel gap. Empty stars use neutral foreground three. Any icon with the icon filled class switches to palette sun foreground three. That class is the one the icon component puts on its own host when its filled input is true, the mock's own class, so the stars stylesheet styles the icon's state without a reflected attribute.

The caption is small, in neutral foreground two. In editable mode each button is a forty pixel circle, a comfortable touch target, and on devices that can hover it gets a neutral background three fill.

## The spec file

Open stars dot spec dot T S. Four helpers find the icons, count the ones carrying the icon filled class, read an icon's size custom property, and find the radios. The setup creates the component and detects changes.

"creates five empty display stars" proves the defaults: five star icons, none filled, and no role and no caption.

"fills stars up to the rating" sets the rating to three through set input and checks the third star is filled and the fourth is not.

"shows a caption after the stars in display mode" checks the caption text. "grows the glyphs for the large size" reads the size custom property on the first icon, eighteen pixels and then twenty four, which exercises the computed signal.

"becomes a radiogroup of five labelled radios when editable" checks the role, the default Rating label, the five accessible names from one star to five stars, and that only the second radio is checked at a rating of two. Then it sets a custom group label and checks it.

And "emits the picked step and clears when the current star is pressed again" subscribes a mock function to the rating change output, clicks the second star and expects two, then clicks the fourth star at a rating of four and expects zero.

## Pitfalls

- Expecting the stars to update by themselves when clicked. They only emit; the parent must feed the new rating back in.
- Editable mode renders five separate buttons, so there are five tab stops and no arrow key handling. If you need the full radio group keyboard pattern, it has to be added.
- Putting a caption on editable stars. It is only rendered in display mode.

## Recap

Things to remember.

- An input named rating plus an output named rating change gives you banana in a box without a model.
- Use model only when the component writes the value itself.
- Computed for the icon size; a plain array for constant steps.
- The host switches role and label from a signal.
- Aria checked marks one star; the fill shows many.
- The spec covers both modes and the clear on second press.

Next, video forty four builds S D status row, the polite live region that tells you what the planner is doing.
