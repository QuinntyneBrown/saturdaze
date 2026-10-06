# 04 · Coding sd-avatar: a computed initial and host class bindings

In this video you build the S D avatar, the small round disc that stands for a family member. It shows the first letter of a name on a tinted background, or a profile photo when there is one. You will find it all over the app: in the top bar next to the signed in user, on the Family page beside each member and on the account card, in the vote rows, on the review submissions queue, and as the live preview in the profile photo dialog. This is the first component in the series with derived state, so it is a good place to meet the computed signal.

## The decorator

Open the avatar file in the components library. The selector is S D avatar, the component is standalone, change detection is OnPush, and there are no imports.

The host block is where most of this component lives. It starts with the class avatar, the block class from the mock stylesheet, and a static aria hidden of true. The avatar is decorative: wherever it appears, the member's name is already written next to it, so a screen reader would only hear the same name twice.

Then come the modifiers. There is one class binding per size, small, medium and extra large, each comparing the size signal with a string. Large is the default and has no modifier, because the base avatar class is already the large size. Then there is one class binding per tone. The person tones map onto the mock's class names, which are the initials of the family in the design: primary gives avatar dash dash q for Quinn, leaf gives s for Sara, sky gives e for Eli, and sun gives m for Mae. Indoor keeps its own name. Keeping the mock's odd names is deliberate: under A D R nine, the component carries the mock's classes exactly, so the same locators and the same stylesheet work in both places.

The avatar photo modifier is on whenever there is a source, using a double negation to turn the string into a boolean. Finally, three attribute bindings mirror name, tone and size onto the host. The tone attribute is removed for the default tone, by returning null.

## Inputs and the computed initial

The class has four inputs. The name defaults to a question mark. The tone is typed as a union of default, primary, leaf, sky, sun and indoor, and defaults to default. The size is a union of small, medium, large and extra large, defaulting to large. And the source is a string or null, defaulting to null.

None of these need a transform. They are not boolean flags, and a union type already rejects a misspelled tone at compile time.

Now the derived state. The initial is a protected computed signal. It trims the name, takes the first character, falls back to a question mark if the result is empty, and upper cases it. Three things make this a good computed. It depends only on other signals, here the name input. It has no side effects. And it is memoised: Angular recalculates it only when the name changes, not on every change detection pass. It is protected, because only the template reads it.

You could write the same expression inline in the template, but a named computed is easier to test, easier to read, and is only evaluated once per change.

## The template

The template is five lines. If there is a source, it renders an image with the avatar image class, bound to the source, with an empty alt attribute. Empty alt is correct here: the image is decorative, and the host is already hidden from assistive technology. Otherwise, it renders the initial inside an ng container, so no extra element is added around the letter.

## The styles

The host is an inline flex circle, thirty two pixels square, with a bold weight, neutral background three and neutral foreground two. Each size modifier changes the width, the height and the font size. Each tone modifier sets a matching pair of tokens: the q avatar uses brand background two with brand foreground two, the s avatar uses the palette leaf background and foreground, and so on for sky, sun and indoor. Always use a background and its paired foreground together, so the contrast is correct by construction, as A D R thirteen describes.

The photo modifier hides overflow, and the image fills the circle with object fit cover.

## The unit tests

The spec file is simple: it creates the avatar, detects changes and keeps the host element. There is no host component, because the avatar has no slots.

The first test, creates a decorative large avatar with a placeholder initial, checks the avatar class, aria hidden, the question mark, the name and size attributes, and no tone attribute.

The next two tests prove the computed. Renders the upper cased first letter of the name sets quinn and expects a capital Q, then sets a name with leading spaces and expects a capital E, which proves the trim. Falls back to question mark for a blank name sets only spaces and expects the question mark.

Maps person tones to the mock avatar classes loops over a table of tone to class, sets each tone with set input on the component ref, and checks both the class and the attribute. The table in the test is the contract.

Mirrors the size to a class and attribute loops over small, medium and extra large, then sets large and checks that the extra large class is gone and the size attribute reads large.

Notice that the source input has no test in this spec. If you change the photo branch, add a test for the image and the photo class first.

## Pitfalls

A few pitfalls. Don't add a large modifier class: large is the base. Don't rename the q, s, e and m classes to something friendlier, or you break parity with the mock. Don't give the image a real alt text while the host is aria hidden. And don't put a side effect inside the computed.

## Recap

Things to remember.

- The host is the avatar, decorative and aria hidden.
- One class binding per modifier, reading signals, with the mock's class names.
- A computed signal derives the initial, memoised and side effect free.
- Background and foreground tokens always come in pairs.
- The tests treat the tone to class table as a contract.

Next, in video five, we build the S D banner, and see how one input drives the A R I A live region.
