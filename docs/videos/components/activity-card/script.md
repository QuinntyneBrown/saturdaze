# 01 · Coding sd-activity-card: inputs, an output and projected chips

In this video you build the S D activity card, the card that suggests one thing to do on the Ideas screen. Each card shows a photo of the place, or a tinted fallback tile with an icon, then the title, a short place line, two lines on why it fits this weekend, a row of chips, and a footer with a Map link and an Add to day button. The Ideas activities page renders one card per suggestion inside a card grid, and that is the only page that uses it. By the end you will have written the component class, the template and the styles, and you will know what each test in the spec file proves.

## The decorator

Open the activity card file in the components library. The decorator sets the selector to S D activity card, marks the component standalone, and imports the three building blocks it renders: the button, the icon and the media frame. Change detection is OnPush. With signal inputs, Angular knows exactly when an input changes, so OnPush is free.

Now look at the host block. The host element itself carries the class card, and the modifier card dash dash media. That is the B E M block from the mock Ideas page, word for word, which is what A D R nine asks for: the component host carries the mock's block class, so the same Playwright locators work against the static mock and the running app. The host block also mirrors two inputs back onto the element as attributes, the title and the tone, by reading the signals directly. A host binding that reads a signal is tracked like a template binding.

## Inputs and the output

Next, the class body. Every input uses the input function, not the old decorator. Each one is a read only signal with a typed default: an empty string for the place line, the why and the map link, the word tree for the icon, and leaf for the tone, typed as a union of leaf or indoor so a typo fails at compile time.

Notice the title. The class field is called card title, and it uses an alias of title. Consumers write title equals, which reads naturally in the template, while the class avoids a field named title that would be easy to confuse with the element's native title attribute.

The media input takes a card media object or null, and null means the fallback tile. The addable input uses the boolean attribute transform. That is the best practice for flags: a consumer can write the bare word addable, with no value, and the transform turns it into true. Without the transform, a bare attribute would arrive as an empty string.

Finally there is one output, add to day, created with the output function and typed as void. It replaces the old event emitter decorator.

Look at what the class does not need. There is no computed signal, no local state and no effect, because the template reads the inputs directly. Keep a presentational card this thin.

## The template

The template starts with the media frame, which receives the photo, the tone and the icon. Then comes the head with an h3 for the title. The place line and the why are each wrapped in an if block, so an empty string renders nothing at all, not an empty paragraph.

The chip row is a single ng content with a select of slot equals chips. Declare each slot once. The page projects S D chip elements with slot equals chips, one if block per chip, never one if block around several slotted nodes.

The footer only exists when there is a map link or the card is addable. The Map link is a quiet, small S D button with an href and a target of blank, so it opens in a new tab. The Add to day button is primary and small, and it gets an accessible label that includes the card title, so a screen reader hears which card it belongs to. Its click handler simply emits the output.

## The styles

The stylesheet is tiny, because the shared card anatomy lives in a partial called card base. The host includes the card host mixin, which sets the padding, the neutral background one fill, the neutral stroke two border and a large border radius, all as tokens read by role. No hex values, as A D R thirteen requires. The only rule of its own clamps the why to two lines.

## The unit tests

Now the spec file. The setup configures the testing module with the activity card and a small host component, creates the card, sets the title input with set input on the component ref, and calls detect changes. Set input is the right tool for signal inputs.

The first test, creates a photo led card whose fallback tile is leaf toned with a tree, and the title, checks the defaults: the B E M classes on the host, a leaf toned fallback tile hidden from assistive technology, the title in an h3, and no place line, body or footer.

Two tests cover content and tone. Renders the place line and the why sets both inputs and reads them back. Switches to the indoor tone and a custom icon proves the tone flows down to the media tile and back up to the host attribute.

Two tests cover the Map link. Adds a Map link that opens in a new tab when the catalogue has one checks the href, the blank target, the no opener rel and the quiet class. Labels the Map link with its glyph and text checks the visible text and the map icon.

The last test, projects chips into the chip row, renders the host component and finds the projected chip inside the chip row. Notice what is not tested: the addable footer and the add to day output have no test in this spec yet. If you change them, add one first.

## Pitfalls

A few pitfalls. Don't drop the boolean attribute transform from addable, or the bare attribute stops working. Don't wrap several slotted chips in one if block, or the slot is lost. Don't wrap the whole card in a link as well as the Map button. And don't rename the B E M classes, because the end to end locators depend on them.

## Recap

Things to remember.

- The host carries the mock's block class, card and card media.
- Signal inputs with typed defaults, an alias for title, and a boolean attribute transform for flags.
- One output for add to day, emitted straight from the template.
- One chips slot, declared once.
- Shared card styles from a mixin, tokens read by role.

Next, in video two, we build the S D auth card, the card that frames every sign in and account form.
