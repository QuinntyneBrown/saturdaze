# 36 · Coding sd-section: a titled region with an action slot

The section component is the titled region of a page. It draws a heading, an optional subtitle, an optional action at the right of the header, and then whatever body you project into it. In this video you will build S D section step by step from its real source files, see why it is just two signal inputs and a host binding or three, and then walk through its spec file.

## Where it is used

Open the Family page template. It is almost entirely sections: "Who's in", "Locked in every weekend", "Home", "Likes and dislikes" and "Preferences". The Home section and the Likes and dislikes section each put a quiet, small Edit button into the action slot, so the button sits at the right of the heading. The three Ideas pages render one section per group of ideas, and the Weekend page uses one titled "Planned around".

By the end you will have a component that labels itself for screen readers with its own heading, keeps the mock's B E M classes, and declares each content slot exactly once.

## The decorator

Open the file called section dot T S in the components library. Above the class sits a module level counter called next section I D, starting at zero. Every instance takes the next number, which gives each heading a unique I D without any service.

The decorator uses the selector S D section, is standalone, points at its own template and stylesheet, and sets change detection to On Push. With signal inputs, On Push costs you nothing: the template only re-renders when a signal it reads changes.

The host block does the interesting work. It adds the class called section, so the host element itself carries the mock's block class. It mirrors the title and the subtitle back to attributes, using or null so an empty string removes the attribute instead of writing an empty one. And it sets aria labelled by to the heading's I D, but only when there is a title.

Best practice: put host bindings in the host property of the decorator, reading signals directly, instead of the older HostBinding decorators. They are typed, they sit next to the selector, and they track signals like any template.

## Inputs

The class has two inputs, both built with the input function rather than the Input decorator. The first is declared as section title, with a default of an empty string and an alias of title. The alias matters: consumers write title equals Members, the way the mock reads, while the class avoids a field called title. The second is subtitle, also defaulting to empty.

Neither input is required, because an untitled section is valid: it is just a block with a bottom margin. The heading I D is a protected read only string, not a signal, because it never changes after construction. There is nothing to derive, so there is no computed signal, and no output, because the section reports nothing back.

## The template

The template opens with an at if block on the section title. Inside it, a div with the class section header holds a text column and an action column. The text column has an H two with the class section header title, bound to the heading I D, and, behind a second at if, a paragraph for the subtitle.

The action column contains an N G content element that selects the action slot. After the header, outside any condition, comes the default N G content for the body.

Notice the rule from the project instructions. Each N G content slot is declared exactly once. The action slot lives inside the at if, which is fine because it appears once, but it does mean an action without a title is not rendered.

## The styles

Open section dot S C S S. The host is a block with a bottom margin of thirty two pixels, removed for the last child, and the respond to mixin raises it to forty pixels on tablets. The header is a flex row aligned to the bottom edge. The title reads font size base six hundred and font weight bold, and the subtitle reads neutral foreground two: tokens by role, never hex values.

One clever line: the action column uses the has selector to hide itself when it contains no element, so an empty slot leaves no gap.

## The spec file

Open section dot spec dot T S. The setup configures the testing module with the component and a small host component, then creates the section on its own and calls detect changes. The host component wraps a section titled Members, with an Edit button in the action slot and a paragraph as the body.

The first test, "creates an untitled section without a header", proves the default: the section class is there, but no header, no aria labelled by and no mirrored attributes.

"renders the heading and labels the section with it" sets the title input through the component ref's set input, then checks the H two's I D matches the S D section pattern and that the host's aria labelled by points at it.

"renders the subtitle under the heading" checks the subtitle paragraph and its mirrored attribute.

And "projects the action into the header and the body below it" uses the host component to prove both slots land in the right place: the button inside the action column, the body directly under the host, not inside the header.

## Pitfalls

- Projecting an action into an untitled section: the header is not rendered, so the action disappears.
- Wrapping several slotted nodes in one at if on the consumer side. That loses the slot; use one at if per node.
- Adding a heading inside the body. The section already provides the H two and labels itself with it.

## Recap

Things to remember.

- Two signal inputs, one with an alias, and no derived state.
- The host carries the B E M block class and the aria labelled by link.
- A module counter gives unique heading I Ds without a service.
- Each slot is declared once; an empty action column hides itself with the has selector.
- The spec uses a host component to prove projection.

Next, video thirty seven builds S D seg radio, a segmented radio group that plugs into Angular forms.
