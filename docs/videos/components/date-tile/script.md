# 16 · Coding sd-date-tile: one computed signal

S D date tile is the small square badge with a short month name above a day number, like May over seventeen. It sits beside events and submissions. The event card uses it inside the library, the review submissions page and the approve submission dialog pass it pre split parts, and the event submitted dialog passes it the submission's start date and time. It is the smallest component in this stretch of the series, which makes it the cleanest example of derived state with a computed signal. In this video you build it and walk through its four tests.

## The decorator

Open the date tile component file. Above the decorator is a constant array of twelve three letter month names, from Jan to Dec. It is a module level constant, so it is created once, not per instance.

The decorator is standalone and OnPush with the selector S D date tile. The host has the static class date tile, and a static aria hidden attribute set to the string true. There is no binding that mirrors the date input onto the host: A D R nine keeps inputs as inputs. Aria hidden is static because the tile is always decorative: assistive technology skips it, so the date must also be carried by the text around it.

## Inputs and the computed signal

There are three string inputs, each defaulting to an empty string. Date takes an ISO date, or an ISO date and time. Month and day take pre split parts, and the doc comment says that when they are given, they win over date.

Then the heart of the component: a protected computed signal called parts. Its function first checks the pre split inputs: if either month or day is set, it returns them as they are. Otherwise it runs a regular expression against the date. The pattern anchors at the start and captures four digits, two digits and two digits, separated by dashes. Because it is anchored only at the start, a date and time also matches. If nothing matches, it returns empty parts. Otherwise it looks up the month name, using the month number minus one as the index, and turns the day into a number and back into a string, which drops a leading zero.

This is the textbook use of computed. The value is derived from three inputs, it is read twice in the template, and it is recalculated only when one of the inputs changes. Doing the same work in a template expression would repeat the parsing on every check. Doing it in an effect that writes to a signal would add a second piece of state that could fall out of sync. Prefer computed for derived state, always.

Notice also what the parser avoids. It never creates a Date object. Reading the digits straight from the string means a local date can never shift by a day because of the viewer's time zone.

## Template and styles

The template is two spans: one with the date tile month class, showing parts month, and one with the date tile day class, showing parts day. The closing angle bracket of the first span is moved to the next line. That is a deliberate formatting trick: it removes the whitespace text node between two inline elements.

The host is a forty four pixel square inline flex column with border radius medium. Its colours are the brand pair, brand background two for the fill and brand foreground two for the ink. The month is ten pixels, bold and upper case with a little letter spacing; the day is eighteen pixels and bold. The weights come from the font weight bold token.

## The spec

Open the spec file. There is no host component. Before each test, the test bed creates the tile and runs detect changes, and two helpers read the month and day text.

Creates a decorative, empty tile checks the class, aria hidden true, and empty month and day.

Renders month over day from an ISO date sets the date input to the seventeenth of May twenty twenty six, and expects May and seventeen.

Accepts an ISO date time and drops the leading zero on the day sets the third of December with a time and a zulu offset, and expects Dec and three.

Renders nothing for an unparseable date sets the words next saturday and expects empty parts.

There is one honest gap. No test sets the month and day inputs, even though three callers use them. A fifth test that sets both, together with a date, and expects the parts to win, would lock in the doc comment's promise.

## Pitfalls

- Don't parse with the Date constructor; time zones can move the day.
- Don't compute in the template or in an effect. Use computed.
- Keep aria hidden, and always say the date in text beside the tile.
- Keep the whitespace trick in the template, or a gap appears between the spans.

## Recap

Things to remember.

- Three string inputs, one protected computed signal.
- Pre split parts win; otherwise an anchored pattern parses the date.
- A static aria hidden attribute for a purely decorative element.
- The brand fill and ink pair for colour.
- Add a test for the pre split parts.

Next, video seventeen builds S D day: one day of the weekend plan, with a sticky header, weather and day actions over its list of blocks.
