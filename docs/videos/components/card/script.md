# 10 · Coding sd-card: a host that is the surface

S D card is the all purpose surface of Saturdaze: a rounded, bordered box that other content sits in. In the app you will find it in three dialogs, lock restaurant, approve submission and event submitted, where it is the recessed summary panel. You will also find it on the family page around the account details, and on the review submissions page, where every submission sits in a card with large padding. The typed cards, like the activity card or the food card, own their own inner structure. This one is deliberately just a container. In this video you build it from its four files: the class, a one line template, the stylesheet, and the spec.

## The decorator and the host

Open the card component file in the components library. The decorator is short and standard. The selector is S D card, the component is standalone, it points at its template and stylesheet, and change detection is OnPush.

The interesting part is the host object. Its first entry is a static class, card. Then come seven class bindings, one per modifier, and seven attribute bindings. There is no wrapper element inside the template: the host element is the card. That is the class contract from A D R nine. The mock stylesheet in the docs mocks folder has a block called card, with modifiers for sunk, large padding, locked, dimmed, muted and span. The component puts exactly those classes on its own host, so the Playwright page objects use one locator for the static mock and the running app.

## Signal inputs

Now the class body. It declares no fields of its own, only inputs. Two of them take a small string union. Variant is either default or sunk, and padding is either medium or large. Both have a default, so a bare S D card is valid. That is why nothing here uses input required: there is no value a card cannot live without.

The other five are boolean flags: locked, dimmed, muted, span and interactive. Each is declared with the input function, a default of false, and the boolean attribute transform. Best practice: prefer the input function to the old Input decorator. A signal input is read only inside the component, the template reads it by calling it, and with OnPush Angular knows exactly which bindings depend on it. The boolean attribute transform is what lets a page write the bare word locked on the tag, with no value. Without it, the empty string an attribute gives you would not type check as a boolean.

Each flag also carries a doc comment that says when to use it. Locked draws a two pixel accent border, for a locked restaurant. Dimmed drops to sixty percent opacity, for the siblings of a locked pick. Muted is eighty five percent, for a pending suggestion. And span makes the card cover every column of a card grid, for the top pick.

## Host bindings that read signals

Look at the bindings again. The sunk class is on when variant equals sunk. The large padding class is on when padding equals large. Each boolean flag maps straight to its class. These expressions are so small that a computed signal would add nothing, so the component binds the inputs directly. Reach for computed when an expression is shared or does real work, not for a single comparison.

The attribute bindings mirror the same state onto the host. Variant and padding render as attributes only when they differ from their defaults, and each flag renders as an empty attribute when true and is removed when false. Returning null is how you remove an attribute in Angular. The result is that a plain card carries just the class card and nothing else, while a modified card says what it is, both in its classes and in its attributes.

## Template and styles

The template is a single default content slot, declared once. Whatever you put between the tags is projected straight into the surface.

The stylesheet is the card block from the mock stylesheet, with colon host substitutions. The host is a flex column with a ten pixel gap, sixteen pixels of padding, and a background, border and radius that all come from design tokens by role: neutral background one for the fill, neutral stroke two for the border, and border radius large. Each modifier is a colon host rule with the class in brackets. Sunk switches to neutral background three with a transparent border. Locked uses status success border active, and trims one pixel of padding to pay for the thicker border, so the content does not shift. The interactive hover lift sits inside a hover media query, so touch screens never get a stuck hover state. The styles are encapsulated, so none of this leaks out to the page.

## The spec

Open the spec file. It declares a small host component whose template renders a sunk card with large padding around a heading. In before each, the test bed imports the card and the host, creates the card on its own, runs detect changes, and keeps the native host element.

The first test, creates a plain card with no modifiers, proves the clean default. The class name is exactly card, and none of the seven attributes is present.

The next two drive inputs through the component ref's set input method, then call detect changes, because that is how a signal input is set from a test. Mirrors the sunk variant and large padding checks both the classes and the attributes. Mirrors every boolean modifier to a class and attribute loops over all five flags, turning each one on and then off again, and asserts that the class and the empty attribute appear and disappear together.

The last test, projects its content directly into the surface, uses the host component. It checks that the first child of the card is the projected heading, with no wrapper in between, which is the whole point of a host that is the surface.

## Pitfalls

- Locked, dimmed and muted are visual only. Say the state in text as well, for example with a chip that reads locked for lunch.
- Interactive adds a hover lift, not semantics. Put a real button or link inside the card.
- Don't add a wrapper div to the template. Page objects and the spec expect content directly inside the host.
- Don't hard code a colour for a new modifier. Add the rule with a token picked by its role.

## Recap

Things to remember.

- The host is the card, carrying the mock's block and modifier classes.
- Signal inputs with defaults, and the boolean attribute transform for bare flags.
- Simple host bindings read the signals directly; computed is for real derivations.
- Return null to remove an attribute.
- Tokens by role, encapsulated colon host rules, and one content slot.

Next in the series, video eleven, S D checkbox: a form control that wraps a real native checkbox.
