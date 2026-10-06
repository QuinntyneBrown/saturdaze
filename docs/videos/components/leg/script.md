# 28 · Coding sd-leg: a tiny, honest timeline row

The leg is the smallest row on the Weekend screen. It sits between two blocks of the plan and says how you get from one to the next: a dotted rail, a car glyph, the drive as "45 min, 52 km", and for longer drives a Directions link. In this video you will build the S D leg component step by step from its real source files, look at the signal inputs it uses and the ones it doesn't need, and then talk about the tests it should have, because this folder has no spec file yet.

## Where it is used

Open the weekend page template in the app project. Inside each day, a for loop walks the day's blocks. When a block has a leg, the page renders an S D leg first, binding three inputs from the block's leg: the label, the aria label, and the directions URL, falling back to an empty string. Then it renders the S D block itself. So the leg always comes directly before the block it leads to.

The mock is the reference. In the weekend mock page, a leg is a list item with the class leg, an aria label like "Travel: 45 minutes, 52 kilometres to Lavender fields", an empty span, a rail span, and a paragraph of text with the icon and the link. Our component has to produce exactly that shape, because the end to end tests and the visual parity checks depend on it. That is A D R nine: keep the mock's B E M classes.

## Step one: the decorator

Create the leg file in its own folder. The selector is S D leg, the component is standalone, it imports the Icon component, and change detection is OnPush.

The interesting part is the host object. The host itself gets the class leg, so the element you place in the page is the B E M block, with no wrapper div. It gets the role list item, because it sits inside the day's list next to the S D block rows. And the aria label attribute is bound to the aria label signal, or null when it is empty, so an empty input never writes an empty attribute.

Best practice: put host attributes in the host metadata, not in a host binding decorator. The bindings read signals directly, and OnPush plus signals means Angular re renders only when one of them changes.

## Step two: three signal inputs

The class has three inputs, all created with the input function and all defaulting to an empty string. Label is the short visible text. Aria label is the long spoken version. Directions URL is optional, and empty hides the link.

Notice what is not here. None of them is required, because a leg with no text should still render without crashing in Storybook. There is no boolean attribute transform, because there are no flags. There is no computed signal, because nothing is derived: the template reads the inputs directly. And there are no outputs, because the link is a plain anchor that leaves the app. Small components should stay this small.

## Step three: the template

The template is four lines of structure. First an empty span, which fills the time column of the grid so the rail lines up with the block discs. Then the rail span, marked aria hidden, because a dotted line means nothing to a screen reader. Then the text paragraph: an S D icon named car at size thirteen, the label, and, inside an if block on the directions URL, an anchor with the class leg link.

The link opens in a new tab with target blank and rel no opener, so the maps page cannot reach back into Saturdaze through window dot opener.

## Step four: the styles

The host is a three column grid: fifty six pixels for the time, twenty four for the rail, and the rest for the text, with a twelve pixel gap and a thirty two pixel minimum height. The bottom border reads neutral stroke two.

The rail is a relative span stretched to the full row height, and its before pseudo element draws the dotted line: two pixels, dotted, in neutral stroke one, centred with a translate. It extends one pixel above and below so the dots meet the rows around it.

The text uses font size base two hundred and neutral foreground two. The link is semibold, underlined, and coloured with palette sky foreground one. Every colour is a token read by role, never a hex value, and every rule is encapsulated in the component, so nothing leaks into the page.

## Testing: what a spec should cover

The leg folder has no spec file today. Its behaviour is exercised today by the weekend page object in the Playwright suite and by two Storybook stories, Default and Short. If you add one, here is what it should prove.

- The host carries the class leg and the role list item.
- The aria label input appears on the host, and an empty aria label leaves no attribute at all.
- The label text renders inside the leg text paragraph, next to the car icon.
- With no directions URL there is no link; with one, the link has the right address, target blank and rel no opener.
- The rail is aria hidden.

The setup would follow the other specs in the library: create the component with the test bed, set inputs with the component ref's set input method, call detect changes, and query the native element.

## Pitfalls

- Wrapping the host in an extra div breaks the grid and the mock parity. The host is the leg.
- Writing an empty aria label instead of null leaves an unnamed list item behind.
- Dropping rel no opener on a new tab link.
- Forgetting the empty first span; the rail then slides into the time column.

## Recap

Things to remember.

- The host is the B E M block, with role list item and a nullable aria label.
- Three plain signal inputs, no transforms, no outputs, nothing derived.
- The rail is decorative and aria hidden; the long label is what assistive tech hears.
- Colours come from tokens by role.
- There is no spec yet, and now you know what it should test.

Next, in video twenty nine, we build S D list, the card surface that stacks rows like these.
