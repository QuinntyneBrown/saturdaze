# 22 · Coding sd-event-card: a typed card built from smaller parts

In this video you will build S D event card, the card that shows one local event on the ideas page's events tab. It leads with a photo, then a date tile, the event title, a line with the place and date, a row of chips, and a footer with a Details link and, for this weekend's events, an Add to day button. A muted variant marks the family's own suggestion that is still waiting for review. The interesting part is composition: the card is built from other library components, and its styles come from a shared Sass mixin.

## The decorator and host bindings

Open event card dot T S. The selector is S D event card, the component is standalone, and it imports four components: button, date tile, icon and media. Change detection is On Push.

The host object adds two static classes, card and card media, the B E M block and modifier from the mock, so the event card shares its anatomy with the activity, food and past cards, as A D R nine requires. A class binding adds card muted when the muted signal is true. The title, date and muted inputs are not mirrored back onto host attributes. Inputs stay inputs, and only classes and ARIA state go on the host, as A D R nine now records; a reflected title used to give every card a native browser tooltip.

## Inputs and an output

The class has ten signal inputs and one output. The title input is aliased: consumers write title, and the property is called card title. Meta is the place and date line. Date is an ISO date for the tile. Month and day, written M O N and day, are pre split parts of the tile; when given, they win over the date.

Muted and addable both use the boolean attribute transform, so a template can write the bare attribute or bind a real boolean.

Media is typed as card media or null, defaulting to null, which tells the media component to show its fallback tile with a ticket icon. Media tone defaults to sky and reuses the media tone type exported by the media component.

Then the output. Add to day is created with the output function and emits void. The card doesn't know what adding to a day means; it only reports the press, and the page decides, which keeps business logic out of the library.

Notice what is missing: no computed signals, no injected services, no local state. Plain signal reads are enough.

## The template: composition

The template starts with S D media, with the card media class, bound to the media and media tone signals and the ticket icon. Then the card head: an S D date tile bound to date, month and day, and next to it the H three with the card title class. The meta paragraph is wrapped in an if block, so it only renders when meta is set.

The chip row projects anything marked with the slot attribute chips. The slot is declared once. On the ideas page each chip is its own node with its own slot attribute, as the project rule asks.

The footer is the one place with real logic. It only renders when there is something to put in it: a URL on a card that is not muted, or the addable flag. Inside, the Details link renders only when the URL is set and the card is not muted, because a pending suggestion shouldn't send people to an unverified site. It is an S D button in the quiet variant, small size, with an href and target blank, and an arrow right icon in the trailing slot. The button component itself adds rel no opener for a target blank link.

The Add to day button is a primary S D button whose accessible label adds the card title, so a screen reader user hears Add to day, colon, and the event name rather than a list of identical buttons. Its click calls add to day dot emit.

## Styles: a shared mixin

Open event card dot S C S S. It is only a few lines. It uses the shared card base partial, and the host includes the card host mixin. That mixin draws the flex column, the padding, neutral background one, neutral stroke two for the border, border radius large, and transitions built from duration fast and curve easy ease. The same partial provides the rules for the head, title, meta, chips, footer and the flush media.

The only event specific rule is the muted modifier, which lowers the opacity to point eight five. Sharing one mixin means all four typed cards stay identical, and a design change lands in one file.

## The spec file

The spec file has a host component that projects a Free chip into the chips slot. In before each, it creates the component with TestBed, sets title and date with fixture dot component ref dot set input, and runs detect changes.

Creates a card with the date tile and title checks that the tile reads Aug and fifteen from the ISO date, the heading, that there is no meta or footer by default, and that the muted class is absent.

Renders the place and date line sets meta. Adds a Details link that opens in a new tab when the event has a url checks the href, target blank, rel no opener, the quiet variant, and that the trailing icon draws the arrow glyph. Labels the Details link with its text checks the visible name. Mutes a pending suggestion and hides its Details link proves the muted rule in both the class and the footer. Projects chips into the chip row renders the host component and checks the slot.

Be honest about the gaps: the spec doesn't cover the addable flag, the add to day output, or the media input. A good next test would set addable, click the button, and expect the output to fire once, with the accessible label including the title.

## Pitfalls

- Don't put business logic in the card; emit add to day and let the page decide.
- Don't show a Details link on a muted suggestion.
- Don't copy card styles; include the card host mixin.
- Don't wrap several chips in one if block; give each chip its own slot attribute.

## Recap

Things to remember.

- S D event card composes media, date tile, button and icon.
- An aliased title input and boolean attribute transforms for muted and addable.
- The output function reports Add to day without knowing what it means.
- The footer renders only when it has content, and the Details link hides on muted cards.
- One shared mixin styles every typed card.

Next, in video twenty three, we build S D filter chip, a toggle chip that filters a list.
