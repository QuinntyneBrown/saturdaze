# 18 · Coding sd-details: label and value pairs from one input

S D details renders a short list of labelled facts, such as a submission's location, cost, ages, link and notes. It is used on the review submissions page, where each submission card passes it an array of items built by the page. It is a small, purely presentational component: one array in, a list of label and value pairs out. That makes it a good place to look at typed array inputs, control flow with for and else if, safe external links, and a responsive two column grid. In this video you build it and walk through its five tests.

## The decorator and the item type

Open the details component file. Before the decorator, it exports an interface called detail item, with three read only fields. Label is a string. Value is a string or null, where null means the family did not give that fact. And href is an optional string or null; when it is set, the value becomes a link. Exporting the type lets the page build its items with full type checking.

The decorator is the familiar shape: selector S D details, standalone, OnPush, and an imports array with the icon component, for the small arrow after a link. The host has a single static class, details, the block from the mock.

## Inputs

There are two inputs. Items is a read only array of detail items that defaults to an empty array. Marking the array read only in the type is a good habit for signal inputs: the component promises not to mutate what the parent passed in. Missing is a string that defaults to not given; it is the placeholder shown for a null value, and the page can change it.

There is no computed signal, no local state, and no output. Every decision happens per item in the template, and a for loop with if blocks expresses that more clearly than a computed list of view models would.

## The template

The template is a for loop over items, tracked by label, since labels are unique within one list. For each item it renders a definition term element with the details label class, holding the label.

Then an if, else if, else chain picks the value. If the item has both an href and a value, the definition element contains an anchor with the details link class. Its href is bound as an attribute, target is blank, and rel is no opener, so the opened page cannot reach back into Saturdaze through the window opener. Inside the link are the value and a twelve pixel arrow icon. Else, if there is a value, the definition element simply shows it. Otherwise it shows the missing text, with an extra faint modifier class.

Notice the order of the first condition. An href without a value falls through to the placeholder, so the page never renders an empty link that a screen reader would announce with no name.

## Styles

The host is a single column grid with an eight pixel row gap. Labels use font size base three hundred in neutral foreground two. Values use font size base four hundred, and overflow wrap anywhere, so a long web address breaks instead of overflowing a narrow card. The faint modifier switches to neutral foreground three. The link uses brand foreground two, the medium weight token and border radius small, so its focus ring has rounded corners.

From five hundred and seventy six pixels a media query switches the host to two columns: a ninety six pixel label column and the rest for values. Note that this breakpoint is written as a plain media query, not with the respond to mixin, and five hundred and seventy six is not one of the shared breakpoints. If the grid ever needs to follow the app's tablet breakpoint, switch it to the mixin.

There is one more thing to be honest about. The stylesheet's comment says the host is the definition list, but the host element is S D details, not a real D L element, and the host adds no role. Definition terms and definitions are only valid inside a D L, so assistive technology may not expose these as pairs. A future change could render a real D L inside the template, or give the host an appropriate role. For now, each label still reads before its value.

## The spec

Open the spec file. At the top is a constant array of three items: a location of Port Credit, a cost of null, and a link with the value example dot com and an href. There is no host component. Before each test, the test bed creates the component, and two helpers collect the label texts and the value elements.

Creates an empty definition list checks the class, and that there are no labels and no values.

Renders one label value pair per item sets the items with set input and detect changes, and expects the three labels in order, three values, and Port Credit without the faint class.

Renders a faint placeholder for a missing value checks that the null cost shows not given with the faint class. Then it sets the missing input to unknown and checks that the text follows, which proves the placeholder is a live binding, not a constant.

Renders an external link when the item has an href checks the href, target blank, rel no opener, the text and the arrow icon. Locking rel no opener into a test means nobody can drop it in a refactor.

Ignores an href without a value passes a link item with a null value, and expects no anchor at all and the faint placeholder instead.

## Pitfalls

- Never render target blank without rel no opener.
- Don't render a link with no text. Fall back to the placeholder.
- Keep the items array read only; build a new array in the page instead of mutating it.
- Watch the semantics: definition terms belong inside a real D L.
- Prefer the shared breakpoint mixin to a one off media query.

## Recap

Things to remember.

- An exported item type and a read only array input.
- A for loop with if, else if and else instead of derived view models.
- Safe external links, and no empty links.
- A configurable placeholder, proven live by the spec.
- Overflow wrap and a two column grid keep long values readable.

Next, video nineteen builds S D dialog, the shell every Saturdaze dialog is built on.
