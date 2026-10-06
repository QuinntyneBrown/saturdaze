# 23 · Coding sd-filter-chip: a toggle that doesn't own its state

In this video you will build S D filter chip, the pill shaped toggle in the filter rows of the ideas and past pages. When a chip is off it is an outline; when it is on it is filled, dark by default or in the chip's own hue when it has a tone. The lesson in this component is about ownership: the chip shows a pressed state, but the page owns the truth.

## The decorator and the host

Open filter chip dot T S. The file starts by exporting a union type, filter chip tone, with seven values: default, leaf, indoor, sky, sun, accent and primary.

The selector is S D filter chip, the component is standalone, and change detection is On Push. There are no imports, because the template is a plain button.

There is no host object at all. The B E M class filter chip lives on the inner button, and the stylesheet makes the host display contents, so the host adds no box of its own and the button is the real flex item in the filter row. Pressed, tone and disabled are not mirrored onto host attributes either. Inputs stay inputs; the accessible state lives on the button, where it belongs. A D R nine records that rule.

## Inputs, an output, and why not model

There are three signal inputs. Pressed and disabled are booleans with the boolean attribute transform, so a story or a template can write the bare attribute. Tone is typed as filter chip tone and defaults to default.

Then the output, created with the output function: pressed change, which emits a boolean. Its doc comment says it all: it emits the next pressed state on click; the page owns the truth.

You might ask why this isn't a model signal. A model input called pressed would give you two way binding for free, and it would also let the chip write its own value, flipping itself the moment it is clicked. That is exactly what the filter rows must not do. On the ideas events page, pressing a window chip calls set window on the events service, which selects that window and so turns the other window chips off; the clicked chip should only look pressed once the page says so. So the chip takes a plain input and reports a request through an output. The real pages bind the input and handle the output separately.

## Derived state with computed

The class list is derived state, so it is a protected computed signal called classes. It returns an object: filter chip is always true, and the modifier, filter chip dash dash tone, is true when the tone is not default. The template binds the class attribute to that object. Computed memoises it, so the object is rebuilt only when the tone changes.

The toggle method is two lines. If the chip is disabled, it returns early. Otherwise it emits the opposite of the current pressed value. A disabled button doesn't fire clicks anyway, but the guard keeps the rule in the component.

## The template

The template is a single button. Its type is button, so it never submits a surrounding form. Its class is bound to the classes signal. aria pressed is bound to the pressed signal, which is what makes this a toggle button for assistive technology: a screen reader announces Outdoors, toggle button, pressed or not pressed. The disabled property is bound to the disabled signal, and click calls toggle.

Inside, one default N G content, declared once, projects the label and any icon.

## Styles

Open filter chip dot S C S S. The host is display contents. The chip itself is a thirty two pixel pill with border radius circular, semibold text, a neutral stroke one outline, neutral foreground two text and a transparent background.

The pressed state is selected with the aria pressed attribute, not with a separate class. That ties the visual state to the accessible state, so they can never disagree. By default the pressed fill is neutral background inverted. Then each tone has its own pressed rule, built from a palette triple: background one, border one and foreground one, for example the leaf palette for leaf, and the status success tokens for accent. One literal remains: the default pressed text is the hex value for white, because the theme has no inverted foreground token yet. Treat that as a gap to close, not a pattern to copy.

Disabled halves the opacity. The hover rule sits inside a media query for devices that can hover, so touch screens don't get stuck in a hover colour.

## The spec file

The spec file has a host component that renders a leaf chip labelled Outdoors. The main block creates the component with TestBed and runs detect changes, with a helper that finds the inner button.

Creates an unpressed toggle button checks the button type, aria pressed false, not disabled, and no tone class. Mirrors pressed to aria pressed sets the input with fixture dot component ref dot set input and checks the button. Mirrors the tone to the button class covers the computed classes.

The key test is emits the next pressed state on click without owning the truth. It clicks the button, expects the output to have been called with true, runs detect changes, and then checks that aria pressed is still false. Only after the test sets the pressed input to true does the next click emit false. That test is the ownership rule written as code.

Disables the button and swallows clicks when disabled proves the guard, and projects the chip text inside the button checks the slot and the tone class from a real template.

## Pitfalls

- Don't switch to a model signal; the chip would flip itself before the page decides.
- Style the pressed state from aria pressed, not a parallel class.
- Keep the button's type as button.
- Don't add a box to the host; it is display contents on purpose.

## Recap

Things to remember.

- Inputs in, an output out: the page owns the pressed state.
- Boolean attribute transforms for pressed and disabled.
- A computed signal builds the class object.
- aria pressed drives both accessibility and styling.
- Tones are palette triples of background, border and foreground tokens.

Next, in video twenty four, we build S D filters, the scrolling row that holds these chips.
