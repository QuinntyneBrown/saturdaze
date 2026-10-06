# 12 · Coding sd-chip: tones, sizes and an output

S D chip is the small rounded pill that labels things across Saturdaze. The idea cards on the activities, food and events pages project chips into their chips slot. Review submissions shows a sun toned chip that reads pending. The family page lists likes as leaf chips with a heart icon and dislikes as warn chips, and its review submissions list item uses a count chip for the number pending. Inside the library, the day, the food card and the chip input all use it too. In this video you build it, including its one output, the remove event, and walk through its six tests.

## The decorator and the host

Open the chip component file. Above the decorator are two type aliases. Chip tone is a union of nine names: default, sun, sky, leaf, indoor, accent, primary, warn and ink. Chip size is medium or small.

The decorator has the usual selector, S D chip, standalone, and OnPush. This time the imports array is not empty: it imports the icon component, because the template renders an S D icon inside the remove button. A standalone component must import every component its own template uses.

As with the card, the host is the chip. The host object sets the static class chip, then one class binding per tone, for example the sun modifier is on when tone equals sun. Then a small modifier for size and a count modifier for the count flag. That is all: tone, size and removable stay inputs and are not copied onto the host as attributes, because A D R nine keeps only classes and A R I A state there. These are the block and modifier classes from the mock stylesheet, so a page object can find a sun chip in the mock and in the app with the same locator.

## Inputs and the output

The class has five inputs and one output. Tone defaults to default and size defaults to medium. Count is a boolean input with the boolean attribute transform; its doc comment says it is the centred numeric badge, the three beside review submissions. Removable is another boolean flag: it adds a trailing remove button. Remove label is a string that defaults to the word Remove, and becomes that button's accessible name.

Then remove, declared with the output function, with a type of void. Best practice: prefer the output function to the Output decorator with an event emitter. It reads like the signal input A P I, it is typed, and the parent listens to it in exactly the same way, with the remove event binding. The chip does not remove itself; it only reports that the user asked. The parent owns the list, so the parent decides. That is the job of an output.

Note what the chip does not need. There is no computed signal, because every host binding is a single comparison. There is no model, because no value flows both ways. And there is no local signal state.

## The template

The template starts with the default content slot, so whatever you write inside the tag, an icon and a label for example, comes first. Then an if block on removable. When it is true, the template renders a native button with the class chip x and type button, so it never submits a surrounding form. Its aria label is bound to remove label, and its click handler emits remove. Inside the button is an S D icon named close, ten pixels in size.

The slot is declared once, outside the if block. Only the button is conditional. That keeps the project rule: never repeat an n g content slot in different branches.

## Styles

The host is an inline flex row, twenty four pixels tall, with a circular radius from border radius circular and a semibold weight from the font weight token. The default colours are neutral background three with neutral foreground two.

Each tone is a colon host rule that sets a background and a foreground as a pair. Sun uses palette sun background one with palette sun foreground one. Accent uses the status success pair, primary uses the brand pair, and warn uses the status danger pair. Because each pair is designed together, contrast is correct by construction.

There is one honest exception: the ink tone uses neutral background inverted, with a literal white for the text. If you touch that rule, prefer an on brand or inverted foreground token over the hex.

A deep selector sets a private size variable on a directly projected S D icon, so a leading icon is thirteen pixels. Small shrinks the height to twenty pixels, and count centres the content with a minimum width. The remove button is a sixteen pixel circle that inherits the chip colour at seventy percent opacity.

## The spec

Open the spec file. The host component renders a sun chip containing an italic glyph element and the word Sunny. Before each test, the test bed creates the chip alone and runs detect changes.

Creates as a plain chip with no modifiers checks the clean default: the class is exactly chip, and there is no remove button.

Mirrors the tone to a host class loops over all eight non default tones with set input, checking the class each time, then sets default and checks that the class name is back to plain chip. Mirrors the small size and the count badge sets both and checks the two classes.

Renders the remove button with its accessible name when removable checks the button exists, has type button, an aria label of Remove, and a close icon. Then it changes remove label to Remove Parks and checks the aria label follows, which proves the binding is live.

Emits remove when the cross is pressed subscribes a vitest mock function to the output, clicks the button, and expects exactly one call. An output from the output function still supports subscribe, which is what makes this test so short.

Projects its content ahead of the remove button uses the host component and checks the glyph is the first child and the text is Sunny.

## Pitfalls

- Don't let the chip remove itself. Emit, and let the parent update its list.
- Always set a specific remove label in lists, such as remove parks, so screen reader users know which chip they are removing.
- Keep type button on the remove button, or it submits the form around it.
- Use tones in their designed fill and ink pairs.
- Import the icon component, or the template fails to compile.

## Recap

Things to remember.

- The host is the chip, with block and modifier classes from the mock.
- Signal inputs with defaults, the boolean attribute transform, and the output function for events.
- One slot, then a conditional native button with an accessible name.
- Tone pairs from the theme give contrast by construction.
- The spec checks every tone, the label binding, and the emitted event.

Next, video thirteen builds S D chip input, which puts these chips to work in an editable list of likes and dislikes.
