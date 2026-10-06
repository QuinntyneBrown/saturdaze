# 31 · Coding sd-media: a photo frame with a graceful fallback

The S D media component is the photo frame at the top of every idea card. It shows a place's photo at a fixed aspect ratio with its credit, and when there is no photo, or the image fails to load, it turns into a tinted tile with a category icon. It is a great small example of local state done right: one private signal, one computed signal, and no effect. In this video you will build it from its real source, then walk through its five unit tests.

## Where it is used

Media is not used directly by app pages; other components compose it. The activity card, the food card and the event card each start with an S D media carrying the card media class, so the frame sits flush with the card's top edge. The food card passes the sun tone with a fork icon, the event card passes the ticket icon, and the activity card passes its own tone and icon. The past card uses it for a weekend's cover photo.

## Step one: the types

Open the media file. Before the component, it exports an interface called card media with five read only fields: source, alt text, width, height and credit. This is the shape the API sends for a place's primary photo, ready to render. Then two string union types: media tone, which is leaf, indoor, sky or sun, and media ratio, which is sixteen by nine or four by three.

Exporting these types next to the component means every card and story that feeds it gets compile time checks on the tone names. Union types are better than free strings here: a typo in a tone fails the build, not the design.

## Step two: the decorator and host bindings

The selector is S D media, standalone, OnPush, and it imports the Icon component.

The host carries the class media, the B E M block from the mock. Then a run of class bindings, each reading signals. Media double dash four by three is on when the ratio input is four by three. Media double dash fallback is on when the computed fallback signal is true. And four tone classes, leaf, indoor, sky and sun, are each on only when the frame is in fallback and the tone matches. Finally, aria hidden is set to true in fallback, or null otherwise.

That last binding is an accessibility decision. The fallback tile is decorative: the card title next to it carries the meaning. A real photo, on the other hand, has alt text, so it stays visible to assistive tech.

## Step three: inputs, a signal and a computed

The class has five inputs. Photo is a card media or null, defaulting to null. Ratio defaults to sixteen by nine, tone to sky, and icon to sparkle. Eager is a boolean with the boolean attribute transform; above the fold images, like a weekend cover, load eagerly while cards stay lazy.

Then the local state. A private signal called failed source holds the source that failed to load, starting at null. A protected computed signal called fallback reads the photo and returns true when there is no photo, or when the failed source equals the current photo's source. And a protected method called failed sets the signal.

Why store the failed source, and not just a boolean? Because the photo input can change. If a card gets a new photo, the comparison no longer matches, so the new image gets its chance to load. No reset logic, no effect watching the input. Derived state belongs in computed, and this is the reason effects are used sparingly in this library: a computed can't get out of sync.

## Step four: the template

The template starts with a let declaration that reads the photo signal once into a local called p. If p exists and we are not in fallback, it renders an image with the media image class. Source and alt are bound from p. Width and height are written as attributes, so the browser reserves the space before the image arrives and the layout never shifts. Loading is eager or lazy depending on the eager input, decoding is async, and the error event calls failed with that source.

If the photo has a credit, a span with the media credit class shows it. Otherwise, in the else branch, an S D icon with the icon input at size thirty two.

## Step five: the styles

The host sets a component knob, S D media credit background, as a color mix of neutral foreground one at seventy eight percent with transparent. It is relative, overflow hidden, has a sixteen by nine aspect ratio, neutral background three, and a medium border radius. The four by three class switches the aspect ratio.

The image fills the frame with object fit cover. The credit chip is absolutely positioned at the bottom right, with a circular radius, the scrim knob as its background, and neutral foreground on brand as its text. A comment explains why: white on a seventy eight percent ink scrim keeps four and a half to one contrast over any image.

The fallback class centres the icon, and each tone class pairs a palette background one with its matching foreground one. Fill and ink in pairs, tokens by role.

## Unit tests

Open the spec file. It defines a sample photo constant: a lavender image, sixteen hundred by nine hundred, credited "Photo, Jo Doe". Each test creates the component with the test bed and drives it with set input.

"Renders a sized, lazy image with its credit" checks source, alt, width, height, lazy loading, the credit text, and that the host is not aria hidden.

"Loads eagerly above the fold" sets eager and checks the loading attribute.

"Shows an aria hidden tinted tile with an icon when there is no photo" sets the leaf tone and the tree icon with no photo, and checks the fallback and leaf classes, aria hidden true, no image, and that the icon actually draws the tree glyph.

"Falls back to the tile when the image fails to load" dispatches an error event on the image, runs detect changes, and proves the image is gone and the fallback class is on. This is the computed signal at work.

"Switches to a four by three frame" checks the ratio class.

## Pitfalls

- Dropping width and height; the page jumps as photos load.
- Using an effect to reset a failed flag when the photo changes, instead of comparing sources in a computed.
- Leaving the fallback tile visible to screen readers.
- Dropping the credit; the photo licence requires it.

## Recap

Things to remember.

- Export the data shape and union types next to the component.
- One private signal for local state, one computed for the derived fallback, no effect.
- Explicit width and height, lazy by default, eager by boolean attribute.
- Decorative fallback tiles are aria hidden; photos keep their alt text.
- The credit scrim is a component knob; tones use fill and ink token pairs.

Next, in video thirty two, we build S D menu, a list of actions with arrow key focus.
