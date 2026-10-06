# 17 · Coding sd-day: a labelled column with two outputs

S D day is one day of the weekend plan. It has a sticky header with a weather disc, the day's name, a meta line and two actions, regenerate and lock, and below it a list of block rows. The weekend page renders one per day, binds the title, meta, weather, locked and busy inputs, and listens to its regenerate and lock toggle outputs. While the plan is loading or generating, the same page renders days without actions, filled with skeleton rows. The landing page and the shared weekend page use it read only, with actions turned off. In this video you build it and walk through its seven tests.

## The decorator

Open the day component file. Above the decorator are three things. A type called day weather, which is sun, cloud, rain or snow. A constant lookup table called weather, that maps each of those to an icon name and a disc tone: sun gets the sun tone, and the other three get sky. And a module level counter called next day id.

The decorator imports four components, button, chip, disc and icon, because the template uses all of them. The host has the static class day and a locked modifier. Title, weather and locked are not mirrored as host attributes: reflecting title used to put a native browser tooltip on the whole column, so A D R nine keeps only classes and A R I A state on the host. The last host binding is the important one for accessibility: aria labelled by, pointing at a heading id. So the whole column is named by its own heading, and assistive technology announces Saturday when you move into it.

## Inputs and outputs

The first input is called day title in the class, with the alias title, and it defaults to Saturday. Meta is a string. Weather is a day weather or null. Then three boolean inputs, each with the boolean attribute transform. Locked. Actions, which defaults to true, and whose doc comment says it shows the regenerate and lock buttons, and is off while generating and in read only views. And busy, which disables the day buttons while a request is in flight.

Two outputs follow. Regenerate is an output of void. Lock toggle is an output of boolean, and it emits the next lock state. Notice that locked stays an input. The day never flips its own lock. It asks the parent, the parent calls the A P I, and the new state flows back down through the input. That keeps a single source of truth on the page, and it is why this is an input plus an output, not a model.

## Derived state

Then three protected members. The heading id is a plain string, S D day followed by the counter, because it never changes. Weather icon and weather tone are computed signals. Each reads the weather input, falls back to sun when it is null, and looks the value up in the table. Two small computed signals, each with one job, read better than one computed that returns an object, and each is only recalculated when the weather changes.

## The template

The template opens with a header element with the day header class. If there is weather, it renders an S D disc with the weather disc class, binding the icon and tone computed signals, at the large size.

Next comes the text block. The heading is a level two heading with the day title class, and its id is bound to the heading id. That is the other end of the host's aria labelled by. Below it, an optional meta paragraph, and, when the day is locked, an accent chip with a lock icon that reads day locked. So the locked state is said in words, not only with colour.

If actions is true, there are two S D buttons, both ghost and small, with a button class of day button. The first has the label regenerate followed by the day title, so its accessible name is regenerate Saturday, not just regenerate. It is disabled while busy, and its click emits regenerate. The second is the lock toggle. Its label switches between lock and unlock plus the day title, its pressed input is bound to locked, so it carries aria pressed, and its click emits lock toggle with not locked: the state the user is asking for. Both buttons show an icon and a short text label.

After the header is a div with the day list class and the role list, holding the default content slot. Each block row sets its own role of list item on its host, so the list semantics line up. Last, a second, named slot selects slot equals footer, for the add an errand ghost row. Each slot is declared exactly once.

## Styles

The host is a block with a min width of zero, so it can shrink in a grid. The header is sticky at the top, with the z index sticky token, neutral background two and a neutral stroke two bottom border. The title uses the font size base six hundred and bold weight tokens.

On phones the action buttons are icon only. A deep selector reaches the day button class inside S D button and squares it to thirty six pixels, and the text labels are hidden. The locked modifier tints the header with status success background one and rounds it.

Inside the respond to tablet mixin, the sticky header moves down by the layout top bar height token, so it sticks below the top bar, and the buttons get their width and text labels back.

## The spec

Open the spec file. The host component renders a sunny Saturday with three block rows, breakfast, park and dinner, and a footer button. Before each test, the test bed creates a bare day, and helpers find the two day buttons. A third helper, glyph, reads the drawn S V G inside an icon, so a test can tell which icon is showing from what it draws.

Creates Saturday with a labelled heading and an empty list checks the defaults, and that the host's aria labelled by equals the heading's generated id. Renders the meta line and the weather disc switches to rainy Sunday, checks the rain glyph and the sky tone class on the disc, then switches to sun to prove the computed signals update.

Shows the Regenerate and Lock buttons with accessible names checks regenerate Saturday, lock Saturday and aria pressed false. Reflects a locked day in the chip, the lock button and the host class checks the locked class, the accent day locked chip, unlock Saturday, aria pressed true and the unlock glyph.

Hides the actions and disables them while busy checks both inputs. Emits regenerate and the next lock state clicks lock and expects true, then sets locked and clicks again, expecting false. Projects blocks into the list and the footer after it uses the host component to prove the three blocks are list items inside the list, and the footer button is the last child, outside it.

## Pitfalls

- Don't let the day change its own lock. Emit the next state and let the parent decide.
- Put the day name in every button label, or a screen reader hears regenerate twice on a two day weekend.
- Keep the host labelled by its heading, and the heading id unique per instance.
- Don't bring back a title attribute on the host. It gave the column a native browser tooltip the mocks never had.
- Use the layout top bar height token for the sticky offset, not a pixel value.

## Recap

Things to remember.

- An aliased title, three boolean flags, and two typed outputs.
- Locked is an input plus an output, not a model: the parent owns the state.
- Two small computed signals read the weather table.
- Accessible names include the day, aria pressed carries the lock, and a chip says it in words.
- A list slot and a footer slot, each declared once.

Next, video eighteen builds S D details: label and value pairs, with a placeholder for missing values and external links.
