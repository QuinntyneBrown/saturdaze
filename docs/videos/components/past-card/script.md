# 34 · Coding sd-past-card: a stateless card where every control emits

The S D past card component shows one past weekend on the Past screen: a cover photo, the dates, a favourite heart, the title, a star rating, a short highlights line, and two actions, Remix and Repeat. It is the clearest example in the library of a presentational component. It holds no state of its own. Every control emits an output, the page decides what happens, and the page writes the result back through the inputs. In this video you will build it from its real source and walk through its six unit tests.

## Where it is used

The Past page renders one past card per weekend inside a card grid, tracked by the weekend's id. It binds six inputs: the title, the date range from the card's eyebrow, the rating or null, the favourite flag, the highlights, and the cover's media or null. And it listens to six outputs: add photo, favourite toggle, rename, rate, remix and repeat. Each handler opens a dialog or calls the A P I, and the new values flow back into the inputs.

## Step one: the decorator

Create the past card file. The selector is S D past card, standalone, OnPush, and it imports four library components: Button, Icon, Media and Stars. A card built from smaller components is still a component; it just composes them.

The host carries two classes, card and card media, matching the card in the past mock page, and nothing else. The title, rating and favourite inputs are not mirrored onto the host: a title attribute there would put a native browser tooltip over the whole card, and the favourite state already lives where assistive tech reads it, as aria pressed on the heart button. A D R nine keeps inputs as inputs.

## Step two: inputs and outputs

Card title is a string input aliased to title, so it doesn't collide with the native title property. Date range is a string like "ten to eleven May". Rating is a number or null, defaulting to null, so the card can tell "not rated yet" from a real score. Favourite is a boolean with the boolean attribute transform. Highlights is a string. And cover is a card media or null; null shows the add a photo control instead.

Then six outputs, created with the output function. Add photo, rename, rate, remix and repeat are typed void: they just say "this was clicked". Favourite toggle is typed boolean, and it emits the next value, not the current one. The page doesn't have to work out the toggle; it just stores what it receives.

Why not a model signal for favourite? A model would let the card flip its own state, and then the card and the server could disagree if the save fails. With an input and an output, the page stays the single source of truth.

## Step three: derived labels with computed

Two protected computed signals derive text from the rating. Rating label is "four of five" when there is a rating, otherwise "Rate it". Rate label is the accessible name of the rate button: "Rate this weekend, currently four of five", or just "Rate this weekend".

These are computed rather than template expressions because each is used as a whole string, they read better in the class, and they only recalculate when the rating signal changes.

## Step four: the template

The template starts with a let declaration reading the cover once. If there is a cover, it renders an S D media with the card media class, bound to the photo. Otherwise it renders a button styled as the media fallback tile, with the sky tone and the card media class. Its aria label is "Add a photo to" plus the title, so each card's control is distinct in a list, and clicking it emits add photo.

Then the card row: the date range as an eyebrow, and an S D button for the heart. It is ghost, small and icon only, with an extra class called fav button passed through the button class input, the label "Favourite this weekend", and the pressed input bound to favourite. That pressed input becomes aria pressed on the real button, which is what makes it a toggle for screen readers. Clicking emits favourite toggle with the negated value. Inside, an S D icon named heart is filled when favourite is true.

The title is an h3 containing a button, so the heading stays a heading while the text is an action. Its aria label is "Rename:" plus the title. The rating is a button wrapping S D stars, with the rate label as its name. The highlights paragraph renders only when there is text. And the footer holds two small buttons: a quiet Remix with a sparkle icon and a primary Repeat with a refresh icon.

## Step five: the styles

The host includes the shared card host mixin from the card base partial, so every typed card shares one surface. The highlights clamp to two lines. The footer is a two column grid and sets the button width knob, S D button width, to one hundred percent so both buttons fill their cells.

The pressed heart turns brand foreground one through an attribute selector on aria pressed true. Because the inner button belongs to S D button, that rule needs ng deep, scoped by the fav button class. Hover rules only apply on hover capable devices. And the add a photo tile matches the cover's sixteen by nine ratio with the palette sky background and foreground pair, plus a visible focus outline in stroke focus two.

## Unit tests

The spec file creates the card with the test bed and sets a title, "Beach and pizza", and a date range before the first detect changes.

"Creates an unrated, unfavourited card" checks the card class, the eyebrow, the title button's text and its "Rename:" label, the rate button's name, no filled star icons and the "Rate it" label, and no highlights.

"Shows the favourite heart as a pressed toggle" checks aria pressed false and an unfilled heart, then sets favourite and checks aria pressed true and that the heart icon now has the icon filled class.

"Reflects the rating in the stars and the rate button name" sets a rating of four, counts four filled star icons, and checks the "four of five" label and the rate button's name. That's the computed signals at work.

"Renders the highlights line" checks the paragraph.

"Emits the next favourite state" clicks the heart and expects true, then sets favourite and clicks again, expecting false.

And "emits rename, rate, remix and repeat from their buttons" subscribes four spies, clicks each control once, and expects exactly one call each.

The add photo tile and the cover photo branch have no unit test in this spec; the cover's behaviour is covered by the media component's own spec.

## Pitfalls

- Letting the card toggle its own favourite state; keep the page the source of truth.
- A bare heart icon without a label and aria pressed.
- Rename and rate as click handlers on plain text instead of buttons.
- Forgetting to write the new values back into the inputs after the dialogs close.

## Recap

Things to remember.

- A stateless card: inputs in, six outputs out.
- Favourite toggle emits the next value; no model, no local state.
- Two computed signals build the rating labels.
- Every control is a real, named button; the heart uses aria pressed.
- Shared card styles come from a mixin, sized through button knobs.

Next, in video thirty five, we build the S D scrolled directive, which has no template at all.
