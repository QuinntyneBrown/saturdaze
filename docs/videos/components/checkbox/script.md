# 11 · Coding sd-checkbox: a native box that speaks reactive forms

S D checkbox is a native checkbox with its label as content. Because the label is projected, it can hold links, which is exactly what the app needs. On the create account page there are two of them: the required one that reads I agree to the Terms and Privacy Policy, with both phrases linking to the legal page, and an optional one for the Friday preview email. Both are bound to a reactive form with form control name. In this video you build the component from its class, template and stylesheet, and then walk through its six unit tests.

## The decorator

Open the checkbox component file. The selector is S D checkbox, the component is standalone, and change detection is OnPush. The host object has just two attribute bindings: checked and required. Each renders as an empty attribute when true and is removed when false, so the host element tells you its state without reaching inside.

The new part is the providers array. It registers the component as an N G value accessor, using use existing with forward ref to the checkbox class, and multi set to true. Forward ref is needed because the class is referenced inside its own decorator, before it is defined. This provider is what lets form control name and N G model talk to the component.

## Inputs and local state

The class implements the control value accessor interface. It has two inputs. Required is a boolean input with the boolean attribute transform, so a page can write the bare word required. Name is a string input that defaults to an empty string.

Notice what is not an input. Checked and disabled are protected signals, created with the signal function. They are local state, not inputs, because the form owns the value. If checked were an input, or a model, two sources of truth would fight: the parent binding and the form control. Here the form writes in through the accessor methods, and the component keeps its own copy in a signal for the template. Making them protected keeps them visible to the template but out of the public A P I.

Best practice: a signal is the right tool for state the component itself owns and updates. With OnPush, setting a signal that the template reads is enough to schedule a re render. No change detector ref, no mark for check.

## The forms contract

Next, two private callbacks, on change and on touched, both starting as functions that do nothing. Register on change and register on touched simply store the functions the forms A P I hands over.

Write value is how the form pushes a value in. It sets the checked signal to the value coerced to a boolean, so null, which a reset form can send, becomes false. Set disabled state sets the disabled signal. That is how disabling the form control disables the box, without a separate disabled input.

The other direction is the protected method handle change. It reads checked from the event target, sets the signal, calls on change with the new value, and then on touched. So a single click both updates the form value and marks the control as touched, which is what validation messages wait for.

## The template

The template is the mock's check block. The outer element is a label with the class check. Wrapping the input in its label means clicking anywhere on the text toggles the box, with no for and id pair to keep unique.

Inside is a real input of type checkbox with the class check input. Its name attribute is bound to name, or null when name is empty, so no empty attribute appears. Checked and disabled are property bindings to the two signals. Aria required is set to the string true only when required, and removed otherwise. And the change event calls handle change. After the input comes a span with the class check label that contains the single default content slot. Because the control is a native input, the browser gives you keyboard support, focus and the checked state to assistive technology for free.

## Styles

The host is display contents. A D R nine calls this out for interactive atoms: the host box disappears from layout, so the label is the element that sits in the form's flow, and the real input carries the accessible name. The check block is a flex row with a ten pixel gap. The input is eighteen pixels square, and its colour comes from accent colour set to status success background three, a token chosen by role rather than a hex value. The label element gets a min width of zero so long text wraps instead of overflowing.

## The spec

Open the spec file. It declares a host component that renders a required checkbox named terms, whose label contains a link to the legal page. In before each, the test bed creates the checkbox on its own, runs detect changes, and keeps both the component instance and the host element. A small helper finds the native input by its class.

Creates an unchecked native checkbox inside its label checks the structure: the label contains the input, its type is checkbox, it starts unchecked, and neither the host attributes nor aria required are present.

Marks required fields and forwards the name sets both inputs with set input and detect changes, then expects aria required to be true, the name on the input, and the required attribute on the host.

The next three exercise the forms contract directly, by calling the accessor methods as the forms module would. Checks the box from a written value and mirrors it to the host writes true, then null, and checks both the input and the host attribute each time. Reports a user toggle to the form and marks it touched registers two vitest mock functions, ticks the input, dispatches a change event, and expects on change with true and exactly one touched call. Disables the box from the form calls set disabled state and expects the input to be disabled.

The last, projects rich label content beside the box, uses the host component to prove that the label text and the link both arrive inside the check label span.

## Pitfalls

- Don't turn checked into an input or a model. The form is the single source of truth.
- Don't forget forward ref in the provider, or the class is used before it exists.
- Coerce in write value. Forms can send null.
- Call on touched as well as on change, or touched based validation never shows.
- Keep the host as display contents and the input native. Don't replace it with a styled div.

## Recap

Things to remember.

- Inputs are for configuration; signals hold state the component owns.
- The value accessor provider plus four methods make it a first class form control.
- A protected change handler updates the signal, then notifies the form.
- A wrapping label, a native input and aria required give accessibility for free.
- Tokens by role, a display contents host, and one content slot.

Next, video twelve builds S D chip, the small pill that labels tags, counts and tones.
