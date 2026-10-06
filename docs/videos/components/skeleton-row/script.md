# 41 · Coding sd-skeleton-row: a decorative loading placeholder

The skeleton row is one shimmering placeholder shaped like a planned block: a short bar where the time goes, a circle where the icon disc goes, and two lines of text. It is the simplest component in the library, with no inputs at all, and that is exactly why it is worth a short video: everything it does lives in the host bindings, the markup shape and the stylesheet. You will build S D skeleton row, then walk through its spec file.

## Where it is used

Open the Weekend page template. While the page is loading, and again while the planner is generating, it renders the two day columns and fills each with a loop of skeleton rows. The containing grid carries aria busy set to true. The shared weekend page does the same while it loads, and the Weekend page also swaps a single day's blocks for skeleton rows while that day regenerates.

The idea is that the placeholder has the same shape as the content that replaces it, so the layout doesn't jump when the real blocks arrive.

## The decorator

Open the file called skeleton row dot T S. The decorator uses the selector S D skeleton row, standalone, its own template and stylesheet, and On Push change detection.

The host block has two static entries. The class called skeleton row puts the mock's block class on the host. And aria hidden is set to true, because a placeholder has nothing to say. Screen reader users learn that the region is loading from the aria busy on the container, and hear the real content when it arrives, rather than four empty shapes.

The class itself is empty. No inputs, no signals, no outputs. That is a legitimate design: when a component has no variation, don't invent inputs for it. On Push still matters, because it means Angular never needs to check this component again after its first render.

## The template

The template is four divs. A div with the classes skeleton and skeleton time, a div with skeleton and skeleton disc, and then a body div with the class skeleton row body holding a skeleton text line and a shorter skeleton text small line. The class names follow B E M: skeleton is the block shared by every shape, and each modifier sets one shape. There is no text anywhere, by design.

## The styles

Open skeleton row dot S C S S. The host is a three column grid: fifty six pixels for the time, thirty two for the disc, and the rest for the body, with a twelve pixel gap, fourteen pixels of vertical padding, and a bottom border in neutral stroke two. The fifty six pixel first column is the same width as the time column of the real block, so the placeholders line up with the content that replaces them.

Each skeleton shape is relatively positioned with hidden overflow, filled with neutral background three and rounded with border radius small. The disc modifier overrides that to a full circle.

The shimmer is an after pseudo element covering the shape, starting translated one hundred percent to the left, with a gradient from transparent through a soft white to transparent. A keyframes rule called S D shimmer moves it to one hundred percent to the right, every one point four seconds, using the curve easy ease token for its timing.

And the last rule is the important one for accessibility: under prefers reduced motion, the animation is switched off. The shapes stay, the movement goes.

## The spec file

Open skeleton row dot spec dot T S. The setup is the minimum: configure the testing module with the component, create it, and detect changes. There are no inputs to set.

"creates a decorative placeholder row" checks the skeleton row class and that aria hidden is true.

"is shaped like a block: time, disc and a two-line body" checks each modifier exists, that the two text lines sit inside the body, and that there are exactly four skeleton shapes.

And "has no text for assistive tech to read" asserts the text content is empty. That test guards the decorative contract: if someone later adds a "Loading" label inside the row, it fails, and points them to the container's aria busy instead.

## Pitfalls

- Forgetting aria busy on the container. The rows are hidden, so the container must say it is loading.
- Adding text inside the row. Put loading messages in a status row instead.
- Dropping the reduced motion rule when changing the animation.

## Recap

Things to remember.

- No inputs is a valid design when nothing varies.
- Static host bindings: the B E M class and aria hidden.
- Match the real row's geometry so nothing jumps.
- Shimmer with a pseudo element, and stop it for reduced motion.
- The spec proves the shape and the silence.

Next, video forty two builds S D spinner, the rotating ring that can carry a glyph in its centre.
