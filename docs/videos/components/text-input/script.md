# 46 · Coding sd-text-input: a labelled field that speaks forms

S D text input is the labelled text field used across Saturdaze: a label with an optional "Required" marker, an input or a text area, and a hint or an error underneath. It appears wherever a user types: the sign in, create account and reset password pages, and dialogs such as add errand, commitment and family member. On sign in, the email field binds with form control name. In this video you will build it from its real source, see how signal inputs, a computed signal, local signals and one small effect work with Angular's control value accessor, and then read its spec file.

## The decorator

Open text input dot T S. Above the class sits a module level counter called next field id. Every instance takes the next number, giving each field a unique id for wiring the label and descriptions.

The selector is S D text input. It is standalone, imports the icon component for the error glyph, and uses On Push. The host gets the class field, the B E M block from the mocks, and mirrors several inputs as attributes: label, type, hint, error, and the flags required, invalid and multiline, which appear as empty attributes when true and vanish when false.

The providers array registers the component itself as an N G value accessor, using forward ref because the class isn't defined yet when the decorator runs, and multi true because the token collects many accessors. That is what lets a page put form control name or N G model directly on the field.

## Signal inputs

Every input uses the input function. Label, value, placeholder, type, hint and error are strings, with type defaulting to text. Required, invalid, multiline and readonly use the boolean attribute transform, so a template can write a bare attribute like multiline and get true instead of an empty string. Invalid marks the control without an inline message, for pages that show one banner for the whole form, as sign in does.

Rows defaults to three for the text area. Autocomplete and name are forwarded so password managers recognise sign in fields. Min, max and step accept a string, a number or null.

## Local and derived state

The id, hint id and error id are plain strings, not signals, because they never change. Two writable signals hold local state: internal value, the text in the control, and disabled. Disabled is a signal, not an input, because here disabling comes from the form.

Then the computed signal called described by. It collects the error id if there is an error and the hint id if there is a hint, and returns them joined by a space, or null when there are none. Computed is the right tool: it is derived purely from two inputs, cached, and recalculated only when they change.

## One effect, and the accessor methods

The constructor has the only effect. It reads the value input and, if it is non empty, writes it into internal value. That is the documented rule: the static value seeds the state, and a later write value from a form overrides it. Effects should be rare; this one exists because internal value has two writers, the input and the form, so it cannot be a computed signal. A linked signal could also model the seed; the effect keeps the "only non empty values seed" rule explicit.

The accessor methods are one line each. Handle input sets internal value and calls on change. Handle blur calls on touched. Write value sets internal value, turning null into an empty string. Set disabled state writes the disabled signal.

## The template

An at if renders the label only when there is one; its for attribute points at the id, and a nested at if adds the "Required" span. Then at if multiline chooses a text area or an input. Both share the class field input, the id, the internal value and the same bindings. Placeholder, name and autocomplete use "or null", so an empty string removes the attribute. Aria invalid is true for an error or the invalid flag, aria described by binds to the computed signal, and aria required follows required. Input and blur call the handlers.

Last, at if error renders the error paragraph with its id and a close icon; otherwise at else if hint renders the hint.

## The styles

The host is the field: a column flex box. The control is forty four pixels high, with neutral background one, a neutral stroke one border, border radius medium, and transitions on duration fast and curve easy ease. States are styled on real attributes. Focus visible uses brand stroke one with a ring in brand stroke two. Aria invalid true switches to status danger border active. Read only uses neutral background three. The error text is status danger foreground one. Tokens by role, no hex.

## The spec

The setup imports the component, creates it, and defines a helper that finds the field input.

The first group checks rendering. "Creates an unlabelled text field" proves the defaults: type text, an id matching the S D field pattern, and no aria invalid or described by. "Links the label to the control and marks required fields" checks the for attribute and aria required. "Describes the control with its hint" and "shows the error instead of the hint and flags the control invalid" check the ids, and that described by lists the error then the hint.

The second group, "forwards type, placeholder, autocomplete, name and numeric bounds", "renders a textarea with the given rows when multiline" and "seeds the control from the static value input", uses set input for every input.

The third group drives the accessor directly: "writes form values into the control", "reports typing and blur back to the form" with V I dot F N spies, and "disables the control from the form".

## Pitfalls

- Clearing the value input does not clear the control, because only non empty values seed it. Reset through the form.
- Keep label, hint and error inside the component, so the ids stay wired.

## Recap

Things to remember.

- Register as an N G value accessor with forward ref and multi.
- Boolean attribute transforms make bare attributes work.
- Writable signals hold local state; a computed signal builds described by.
- One effect seeds the value; keep effects rare.
- Style states on real attributes with tokens by role.

Next, in video forty seven, we look at S D theme provider, a directive that re themes part of the page at runtime.
