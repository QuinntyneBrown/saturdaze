# 29 · Coding sd-list: a list host and one boolean input

The S D list component is almost nothing, and that is the point. It is the container that stacks list item rows: the family members on the Family screen, the weekly commitments, the summary inside the calendar dialog. It owns two things, the list role for assistive tech and an optional card surface. In this video you will build it from its real source, see why a boolean attribute transform matters even for one flag, learn a neat trick with a custom property that the rows read, and then walk through its three unit tests.

## Where it is used

Search the app project for S D list and you find it on the Family screen, the Weekend screen, and in two dialogs: the calendar dialog and the errand added dialog. Every one of those usages writes S D list with the bare card attribute, and puts S D list item rows inside. On the Family screen, a for loop renders one action row per family member, each with an avatar in its leading slot, and an S D ghost row for "Add a family member" sits just after the list, outside it.

## Step one: the decorator

Create the list file. The selector is S D list, the component is standalone, and change detection is OnPush. There are no imports, because the template uses nothing but content projection.

The host object does all the work. The class list is always present, so the host is the B E M block from the mock. The role is list, which is what lets a screen reader announce "list, four items". A class binding adds list double dash card when the card signal is true. And an attribute binding writes an empty card attribute when it is true, or null when it is false.

Why mirror the input back as an attribute? Because the Playwright page objects and the Storybook source view can then see the state on the host element, exactly like a native boolean attribute. When it is false, null removes the attribute entirely instead of writing card equals false.

## Step two: one boolean input

The class has exactly one line: a card input, defaulting to false, with transform set to boolean attribute.

This is the best practice to remember. Without the transform, writing the bare word card in a template passes an empty string, and the input type would have to be string or boolean. With the boolean attribute transform, the bare attribute, card equals true, and a bound expression all become a real boolean. Use the input function rather than the old input decorator: you get a read only signal, and the host bindings can call it directly.

Nothing is derived, so there is no computed signal, and there are no outputs, because a list does nothing on its own. The rows handle interaction.

## Step three: template and styles

The template is a single ng content element. One default slot, declared once.

The styles are where the trick lives. The host is a flex column, and it sets a component knob called S D list pad x to zero pixels. When the host has the list card class, it draws the surface with neutral background one, a one pixel border in neutral stroke two, a large border radius, and it raises S D list pad x to sixteen pixels.

The list never reaches into its rows. Instead, each list item reads that custom property for its horizontal padding. Custom properties inherit down the DOM tree, and Angular's emulated encapsulation only scopes selectors, so the parent can tune its children without a deep selector. The knob keeps the S D prefix, because it is the component's own API, not a theme token.

## Unit tests

Open the spec file. The setup imports the list and a small host component into the test bed, creates the list itself, runs detect changes, and keeps the native element as the host. The host component renders a card list with three list items titled Quinn, Sara and Eli.

The first test, "creates a plain list", proves the defaults: the host has the list class and the list role, but no card class and no card attribute.

The second, "draws the card surface when asked", sets the card input to true with the component ref's set input method, runs detect changes, and checks both the card class and the empty card attribute. Using set input is the right way to drive signal inputs in a test; assigning to the property would not work, because the input is read only.

The third, "projects list items as its direct children", renders the host component. It checks that the list has the card class, that it has exactly three children, that every child has the role listitem, and that their titles read Quinn, Sara and Eli in order. That last test is the one that guards the list semantics: rows must be direct children of the list.

## Pitfalls

- Projecting something other than list items, like the ghost row, inside the list. It breaks the item count screen readers announce.
- Using a plain boolean input without the transform; the bare card attribute then arrives as an empty string.
- Styling rows from the list with deep selectors instead of the padding knob.

## Recap

Things to remember.

- The host is the list: the B E M class and the list role live in host metadata.
- One boolean input with the boolean attribute transform, mirrored as an attribute.
- The card surface uses tokens by role.
- A component knob, S D list pad x, passes padding down to the rows without breaking encapsulation.
- The spec checks defaults, the card state, and that items are direct children.

Next, in video thirty, we build S D list item, the row that reads that padding and can be a div, a link or a button.
