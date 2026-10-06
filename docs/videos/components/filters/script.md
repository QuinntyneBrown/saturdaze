# 24 · Coding sd-filters: a labelled row that scrolls or wraps

In this video you will build S D filters, the row that holds the filter chips from the previous video. On a phone it is a full bleed horizontal scroller that you swipe through; from seven hundred and twenty pixels it wraps onto several lines. It appears at the top of the ideas activities, events and food pages and the past page, always with the label Filters. It is one of the smallest components in the library: two inputs, a one line template, and a stylesheet that does most of the work. It is a good lesson in how much a component can get from host bindings alone.

## The decorator and host bindings

Open filters dot T S. The selector is S D filters, the component is standalone, it has no imports, and change detection is On Push.

The host object starts with a static role of group. A group tells assistive technology that the chips belong together, and the next binding gives the group a name: aria label, bound to the label signal. A screen reader user hears Filters, group, before the first chip, instead of a run of unrelated toggle buttons.

Then come two class bindings driven by one signal. When scroll is true the host gets scroller x; when it is false, the host gets filters. Those are the two class names the mock stylesheet uses for the same two layouts, so the component keeps B E M parity with the design reference, as A D R nine requires. What the host does not get is a scroll attribute: inputs are not mirrored back onto the host. Only classes and ARIA go there, and A D R nine records that rule.

## Two inputs and nothing else

The class has two signal inputs. Label is a string that defaults to Filters, so the group always has an accessible name, even if a consumer forgets to set one.

Scroll defaults to true and uses the boolean attribute transform. The transform is especially useful here because the default is true. It turns the string false into the boolean false, so a template can write scroll equals false as a plain attribute and get a wrapping row, exactly as the doc comment describes.

That's the whole class. No computed signals, because the host bindings read the signals directly and a negation is not worth a derived signal. No outputs, because the row has no behaviour of its own; the chips inside it emit. No injected services and no effects.

## The template

The template is one default N G content. Everything the consumer puts inside, chips and dividers, is projected in order. The doc comment says to separate chip groups with a span carrying the global class S D v divider, and the ideas events page does exactly that, between the time window chips and the category chips. That divider is a global utility rather than part of this component, because it is a shared foundation used in more than one place.

Because the template has no wrapper element, the host itself is the flex container, and each projected filter chip, which is display contents, contributes its inner button as a flex item.

## Styles: two layouts on the host

Open filters dot S C S S. There are two host rules. The host with the filters class is a wrapping flex row with an eight pixel gap.

The host with the scroller x class is the interesting one. It is a flex row that never wraps, scrolls horizontally, contains overscroll so a swipe doesn't drag the page, and hides the scrollbar. It is full bleed: a negative inline margin equal to the layout gutter token pulls it out to the screen edges, and matching padding puts the first chip back in line with the page content. Because the gutter is a responsive token, this stays correct at every breakpoint. A mask image with a linear gradient fades the first and last sixteen pixels, hinting that there is more to scroll. The hash zero zero zero stops in that gradient are mask alpha, not a colour, so they are not a token violation.

A rule with N G deep sets flex none on every direct child, so chips keep their natural width instead of shrinking. Then the respond to mixin at tablet turns the scroller back into a wrapping row, removes the overflow, the bleed and the mask.

## The spec file

The spec file has a host component with a filters row labelled Kind, holding an All chip, a divider span and an Outdoors chip. The main block creates the component with TestBed and runs detect changes.

Creates as a labelled group checks the group role and the default label. Scrolls horizontally by default checks the scroller x class, and the absence of the filters class. Wraps when scroll is turned off sets scroll to false with fixture dot component ref dot set input and checks that the classes swap. Uses the label input as the accessible name sets a new label.

Projects chips and dividers in order renders the host component and checks the group's label, that its children are a chip, a span and a chip in that order, and that two filter chip buttons exist.

## Pitfalls

- Don't drop the label; a group without a name is noise to a screen reader.
- Don't add a wrapper element; the host is the flex container.
- Use the layout gutter token for the bleed, never a fixed number.
- Don't put the divider inside a chip; project it between chips.

## Recap

Things to remember.

- A static group role and a label input make the row accessible.
- One boolean input, with the boolean attribute transform, picks between two mock classes.
- No computed, output or effect is needed; host bindings read signals directly.
- The scroller is full bleed using the gutter token, and wraps from tablet up.

Next, in video twenty five, we build S D food card, the restaurant card on the ideas food page.
