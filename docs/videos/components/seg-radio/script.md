# 37 · Coding sd-seg-radio: a segmented radio group for Angular forms

The seg radio component is a segmented radio group: a pill shaped track with two or three options, like Saturday, Sunday or Either, where the picked option lifts out as a white segment. Under the paint it is a set of real native radio buttons, and it plugs into Angular forms as a control value accessor. You will build S D seg radio from its real source, then walk through its spec file.

## Where it is used

Search the app and you will find it in three dialogs: add errand and add to day ask "Which day", and the commitment dialog asks "Day". Each binds it with N G model, passes a label and an options array, and listens to N G model change to update its own signal.

The job: a labelled group of radios that reads and writes one string through the forms A P I, keeps the mock's B E M classes, and needs no custom keyboard code.

## The option type and the decorator

Open the file called seg radio dot T S. It exports a small interface, seg radio option, with a read only value and a read only label, both strings. Below it sits a module level counter that gives every instance a unique I D.

The decorator uses the selector S D seg radio, standalone, its own template and stylesheet, and On Push change detection. The host gets the class called field, because in the mock the whole control is a field: a label above the control. And that is the whole host block. The label and the value are not mirrored onto the host as attributes: nothing read them, so, as A D R nine now records, only classes and A R I A state go on the host.

Then comes the providers array. It registers the component as N G value accessor, using forward ref to point at the class itself, with multi set to true. That is what lets a parent put N G model or a form control name directly on the element.

## Inputs and local state

The class implements control value accessor. It has two signal inputs, label and options, both made with the input function, with an empty string and an empty array as defaults.

Now the interesting choice. The current value and the disabled flag are not inputs. They are protected signals made with the signal function. Why? Because in a form control, the forms A P I owns the value. It pushes values in through write value and the disabled state through set disabled state. Storing them in signals means the template reacts to those imperative calls automatically, even under On Push.

Why not a model signal for two way binding? Because that would give the component two sources of truth, the binding and the form.

One computed signal derives the layout. It is called three, and it is true when there are three or more options. Computed is the right tool for derived state: it is cached, and it only recalculates when the options input changes.

## The methods

The pick method runs when a radio changes. If the group is disabled it returns early. Otherwise it sets the value signal, calls the registered on change callback with the new value, and calls on touched.

Write value sets the signal, turning null into an empty string. The two register methods store the callbacks, which start as no-op functions, and set disabled state writes the disabled signal.

## The template

The template opens with an at if on the label. When there is one, it renders a span with the class field label, bound to a label I D derived from the component I D.

Below it is a div with the class seg radio, plus the modifier seg radio three when the computed signal is true. It has role radio group, and aria labelled by pointing at the label, but only when a label exists.

Inside, an at for loop tracks options by their value. Each option is a label element with the class seg radio opt, wrapping a native input of type radio. Every radio shares the same name, the component I D, which is what makes them one group. Value, checked and disabled are all bound from signals, and the change event calls pick.

Because they are real radios with one name, the browser gives you arrow keys, a single tab stop and correct announcements for free.

## The styles

Open seg radio dot S C S S. The track is a two column grid with four pixels of padding, the neutral background three fill and a circular radius. The three modifier switches to three columns.

Each option is a thirty six pixel pill, with the native input stretched invisibly over it, so the whole pill is clickable.

The selected look uses the has selector: an option that has a checked input gets neutral background one, neutral foreground one and shadow four. Focus works the same way: an option whose input is focus visible draws an outline from stroke width thick and stroke focus two. No class toggling in TypeScript, and every value is a token read by role.

## The spec file

Open seg radio dot spec dot T S. A constant holds three options. The setup creates the component, sets the options through the component ref's set input, and calls detect changes. Two helpers find the group and the radios.

"creates a radiogroup with one native radio per option" proves the structure: the field class, the radio group role, three radios with the right values, one shared name matching the S D seg radio pattern, and nothing checked yet.

"widens to three columns for three options" proves the modifier comes and goes with the options. "labels the group with the field label" proves the accessibility link: no label, no aria labelled by; with a label, the group points at the label's I D.

The last three tests drive the control value accessor directly. "checks the radio matching a written value" calls write value with Sunday and expects only the middle radio checked. "reports a user pick to the form and marks it touched" registers mock callbacks, dispatches a change on Either, expects both callbacks, and then checks that Either is the checked radio. And "disables every radio from the form and ignores picks" calls set disabled state, then checks a change event does not reach the form.

## Pitfalls

- Binding the value with an input instead of N G model or a form control. The value only flows through the control value accessor.
- Options with duplicate values. The loop tracks by value, and the radios would be indistinguishable.
- Passing more than three options. The grid only has two and three column layouts.

## Recap

Things to remember.

- Register N G value accessor with forward ref to plug into forms.
- Form owned state lives in signals, not inputs or a model.
- Computed derives the three column modifier.
- Native radios with one shared name give keyboard support for free.
- The has selector styles checked and focused options without TypeScript.
- The spec drives write value, register on change and set disabled state directly.

Next, video thirty eight builds S D segments, pill shaped tabs that are either router links or an ARIA tab list.
