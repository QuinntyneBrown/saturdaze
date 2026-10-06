# 45 · Coding sd-strength: a three segment meter from two inputs

S D strength is the password strength meter: a thin bar of three segments that fill red, amber or green, with an optional line of text underneath, such as "Strong password". You will find it in two places in the app: the create account page and the reset password page, both directly under the password field. In this video you will build it from its real source files, see why it needs nothing more than two signal inputs and some host bindings, and then walk through its spec file.

## The decorator

Open strength dot T S in the components library. The file starts by exporting a type called strength level, which is the union of three strings: weak, ok and strong. Exporting the type lets the code that computes the level use the same vocabulary as the component.

The decorator is the standard shape for this library. The selector is S D strength. It is standalone, with a template file and a style file, and change detection is On Push. With signal inputs, On Push costs you nothing: Angular knows exactly which views read which signals, so the meter only re renders when its own inputs change.

The interesting part is the host object. The host element gets the static class strength, which is the B E M block from the mock stylesheet. That parity matters, as A D R nine says, because the mocks, the end to end locators and the component all agree on the same class names. The host also gets aria live set to polite. That turns the whole meter into a polite live region, so when the label changes from "Weak" to "Strong", a screen reader announces it without interrupting the user's typing.

Then come three class bindings, one modifier per level. Each one compares the level signal to a string: strength dash dash weak when the level is weak, and so on. And finally the level itself is mirrored to a plain attribute on the host. That attribute is for tests and for anyone inspecting the DOM; when the level is null, Angular removes the attribute entirely.

## Two signal inputs

The class body is just two lines. The level is an input of strength level or null, defaulting to null, so a meter with an empty password shows no colour at all. The label is a string input defaulting to an empty string.

Notice what is not here. There is no decorator based input, no setter, no ng On Changes. The host bindings call the level signal directly, and the template reads both signals. There is no computed signal either, because the only derived value is the modifier class, and the host binding expressions are already the cheapest place to compute it. There is also no output: the meter only displays. The page owns the logic; in create account, a computed signal called strength runs the shared password strength helper over the password, and the template passes its level and label straight in.

## The template

The template has two parts. First, a div with the class strength bar and aria hidden set to true, holding three empty spans, each with the class strength seg. The segments are hidden from assistive technology because they are pure decoration: the label carries the meaning. You will see odd looking closing angle brackets between the spans; that is Prettier keeping the spans touching, so no whitespace text nodes sneak in between them.

Second, an at if block. Only when the label signal is non empty does it render a span with the class strength label containing the text. No label, no empty element.

## The styles

Open strength dot S C S S. The comment at the top says the host is the meter, so the host is a column flex box with a six pixel gap. The bar is a grid of three equal columns, four pixels high, with a four pixel gap. Each segment is a pill, border radius circular, filled with neutral stroke two, the quiet empty state.

The level rules are where the design lives. Each one targets the host with a modifier class and then picks segments with n th child. Weak fills only the first segment with status danger background three. Ok fills the first two with palette sun background three. Strong fills all three with status success background three. These are tokens by role, as A D R thirteen requires; there is not a hex value in the file. The label uses font size base two hundred and neutral foreground two.

Because the styles are encapsulated, those selectors cannot leak out, and nothing outside can restyle the segments by accident.

## The spec

Open strength dot spec dot T S. The setup is the simplest form of TestBed: import the standalone component, create it, run detect changes, and keep the native element as the host.

The first test, "creates a polite live meter with three hidden segments", checks the contract you just built: the strength class on the host, aria live polite, the bar hidden from assistive technology, and exactly three segments.

The second, "has no level and no label until told", proves the defaults: no level attribute, only the base class, and no label element in the DOM.

The third, "mirrors the level to a host class and attribute", loops over weak, ok and strong, setting the input with the component ref's set input method and running detect changes each time. It also checks that the previous modifier is removed, and that setting the level back to null clears the attribute. That last part protects the null default.

The fourth, "announces the label text", sets a label and reads it back from the label element.

## Pitfalls

- Don't put aria live on the label span that comes and goes. A live region must exist before its content changes, which is why it sits on the host.
- Don't add colour classes in the page. The level input is the only way to colour the meter.
- Don't make the segments focusable or give them roles. They are decoration.

## Recap

Things to remember.

- Two signal inputs and host bindings are the whole component.
- The host is the B E M block and a polite live region.
- Modifier classes and n th child turn one level into one, two or three segments.
- Colours are status and palette roles, never hex.
- The spec drives inputs with set input and checks attributes and classes.

Next, in video forty six, we build S D text input: a labelled field that plugs into Angular forms.
