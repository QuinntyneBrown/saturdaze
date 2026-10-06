# 25 · Coding sd-food-card: states, votes and two outputs

In this video you will build S D food card, the restaurant pick on the ideas food page. Each card has a photo, the name and style line, chips, the family vote row, a See menu link and a Lock it in button. It has three states that matter: the top pick spans the whole grid, a locked pick gets an accent border and loses its lock button, and once one pick is locked, its siblings are dimmed with voting disabled. It is a sibling of the event card from video twenty two, so this video focuses on what is new: state modifiers, a relayed output with a typed payload, and a second output.

## The decorator and host bindings

Open food card dot T S. The selector is S D food card, the component is standalone, and it imports five components: button, chip, icon, media and vote row. Change detection is On Push.

The host gets the static classes card and card media, the same B E M block and modifier every typed card uses, as A D R nine requires. Then three modifier classes are bound to signals: card span when top pick is true, card locked when locked is true, and card dimmed when dimmed is true. The title and the three states are not mirrored onto host attributes: inputs stay inputs, and only classes and ARIA go on the host. A reflected title used to put a native tooltip on every card, so A D R nine now records the rule.

## Inputs and outputs

The class declares eleven signal inputs and two outputs. The title input is aliased: consumers write title, and the property is called card title. Meta is the style line.

Four inputs are booleans with the boolean attribute transform: top pick, locked, dimmed and votes disabled. Locked label defaults to the word Locked; its doc comment shows the real values, Locked for lunch and Locked for dinner. Menu URL is a string, and media is card media or null, where null shows the fallback tile.

Votes is typed as a read only array of vote cells, defaulting to an empty array. Each cell has a name, an avatar tone and a vote of up, down or none. Read only documents that the card never mutates it.

One input deserves an honest note. Tone, typed as the disc tone, is declared, and the ideas food page binds it, but the template never reads it. It looks like a leftover from the older design with a fork disc, which the doc comment still mentions. An unused input is still public A P I, so it is worth cleaning up.

Now the outputs, both created with the output function. Vote change emits an object with an index and a vote. Lock in emits void. As with the event card, the card only reports; the page decides what locking means and which cards become dimmed.

There are no computed signals, no injected services and no local state.

## The template

The template starts with S D media, the card media class, the photo bound to the media signal, a fixed sun tone and the fork icon for the fallback.

The head shows the H three title and, inside an if block, the meta line. Beside them, an if and else if chain picks one chip: when locked, an accent chip with a small lock icon and the locked label; otherwise, when it is the top pick, a primary chip that says Top pick. Locked wins, so there is never more than one chip.

The chips slot is declared once. Then, only when the votes array is not empty, S D vote row. It receives the votes, the disabled flag, and a label that adds the card title, Family vote for, and the restaurant name, so each vote row has a unique accessible name. Its vote change event is relayed straight out through this component's own vote change output. That is the pattern for nested outputs: re emit, don't handle.

The footer uses the between modifier to push its two items apart. When there is a menu URL, it shows a quiet See menu link that opens in a new tab; otherwise an empty span keeps Lock it in on the right. Lock it in only renders when the card is not locked, and it is disabled when the card is dimmed.

## Styles

Open food card dot S C S S. Like the event card, it uses the shared card base partial and includes the card host mixin.

Three modifier rules follow. Card span sets grid column one to minus one, so the top pick spans every column. Card locked draws a two pixel border in the status success border active token and reduces the padding to fifteen pixels, so the thicker border doesn't change the card's size. Card dimmed lowers the opacity to point six.

## The spec file

The spec file defines two vote cells, Quinn and Sara, and a host component that projects a Pizza chip. In before each it creates the card with TestBed, sets the title with fixture dot component ref dot set input, and runs detect changes.

The first test, creates a photo led card with a fork fallback tile, the name and a Lock it in button, checks the defaults: the fork fallback, no state chip, no vote row, an enabled lock button and none of the span, locked or dimmed classes.

Two tests cover the style line and the See menu link. Marks the top pick with a spanning card and a primary chip covers the top pick state. Shows a locked pick with the accent border, chip and no lock button sets top pick and locked together, proving that locked wins. Dims siblings of a locked pick and disables their lock button covers dimmed.

Emits lock in when the primary button is pressed covers the second output. Renders the family vote row and relays its votes checks the vote row's label, clicks the first up button and expects index zero and vote up, then checks that votes disabled disables every button. Projects chips into the chip row checks the slot.

## Pitfalls

- Don't decide locking inside the card; emit lock in and let the page update every card.
- Relay nested outputs instead of handling them.
- Remove inputs the template doesn't read, like tone here.

## Recap

Things to remember.

- Three boolean inputs map to three B E M modifiers on the host.
- An if and else if chain shows exactly one state chip.
- Vote change relays a typed payload from the vote row; lock in reports a press.
- A read only array input documents that the card never mutates its votes.
- One shared mixin plus three small modifier rules style the card.

Next, in video twenty six, we build S D ghost row, the dashed add row that renders as a link or a button.
