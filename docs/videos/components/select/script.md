# 39 · Coding sd-select: a native select in field clothes

The select component is a native select element dressed like the other form fields: a label above, a forty four pixel box with a chevron, and an optional hint below. It plugs into Angular forms as a control value accessor over a string value. You will build S D select step by step from its real source, see why it deliberately stays native, and then walk through its spec file.

## Where it is used

Search the app and you will find it in two dialogs. The add errand dialog asks "Roughly how long", with a list of durations, and the add to day dialog asks "When". Both bind it with N G model and update a signal from N G model change, exactly like the seg radio in the previous video.

Why a native select rather than a custom dropdown? Because the browser already gives you keyboard handling, type ahead, the platform picker on phones, and correct screen reader semantics. A custom listbox would need all of that rebuilt. The component only adds the field clothes.

## The option type and the decorator

Open the file called select dot T S. It exports an interface called select option, with a read only value and label, and a module level counter for unique I Ds.

The decorator uses the selector S D select, standalone, its own template and stylesheet, and On Push. The host gets the class called field, and nothing else. The label and required inputs are not mirrored onto the host as attributes: nothing read them, so, as A D R nine now records, only classes and A R I A state go on the host. Required shows up where it matters, as visible text in the label.

The providers array registers the component as N G value accessor, with forward ref pointing at the class and multi set to true. That is what makes N G model and form control name work on the element.

## Inputs and local state

There are five signal inputs, all made with the input function: label, options, hint, required and name. Required uses the boolean attribute transform, so a consumer can write the bare word required. Name is forwarded to the native element.

The I D is a plain protected string from the counter. The current value and the disabled flag are protected signals made with the signal function, because the forms A P I owns them and writes them imperatively. With signals, the template stays correct under On Push without any manual change detection call.

There is no computed signal here: nothing is derived. And no output or model, because the control value accessor is the only channel back to the parent.

## The methods

Handle change reads the value from the event's target, sets the value signal, then calls on change and on touched. Write value sets the signal, mapping null to an empty string. The two register methods store callbacks that start as no-op functions, and set disabled state writes the disabled signal.

## The template

The template starts with an at if on the label. It renders a real label element with the class field label, linked to the select through its for attribute. When the field is required, a small span with the class field req reads Required, so the requirement is visible text, not just an asterisk.

Then comes the native select with the class field input. Its I D comes from the counter, its name attribute is bound with or null so an empty name is left off, and disabled and value come from signals. Both the change event and the blur event call handle change.

Inside, an at for loop tracks options by value and renders one option each, with selected bound to whether it matches the current value. Binding selected on each option, as well as value on the select, helps keep the right option chosen when the options arrive after the value.

Finally, behind another at if, a paragraph with the class field hint shows the hint.

## The styles

Open select dot S C S S. The host is a column flex with a six pixel gap: label, control, hint. The label reads font size base three hundred, font weight medium and neutral foreground two.

The select itself is forty four pixels high with extra right padding for the chevron. It uses neutral background one, a neutral stroke one border, border radius medium and neutral foreground one text. Appearance none removes the platform arrow, and the chevron is drawn as an inline S V G background image. That one S V G carries its stroke colour as an encoded hex value, because a custom property cannot reach inside a data U R L.

Focus visible swaps the outline for a brand stroke one border and a three pixel ring of brand stroke two. Disabled drops the opacity to sixty percent.

## The spec file

Open select dot spec dot T S. A constant holds three options. The setup creates the component, sets the options through the component ref's set input, detects changes, and a helper finds the native select.

"creates a native select in field clothes with one option per entry" proves the field class, the I D pattern, the option values and labels, and no label or hint by default.

"links the label to the select and marks required fields" sets label, required and name, then checks the label's for attribute equals the select's I D, the Required marker and the forwarded name: rendered D O M, not host attributes.

"renders the hint under the select" checks the hint paragraph.

The last three drive the control value accessor. "selects the option matching a written value" calls write value. "reports a user change to the form and marks it touched" sets the native value, dispatches a change, and expects both callbacks. And "disables the select from the form" calls set disabled state and checks the native disabled property.

## Pitfalls

- Blur also calls handle change, so the form hears on change again when the field loses focus. Keep change handlers idempotent.
- There is no placeholder option. If nothing should be preselected, include an explicit empty option in the list.
- Don't replace it with a custom dropdown for looks. You would have to rebuild the keyboard and mobile behaviour the browser gives you.

## Recap

Things to remember.

- Stay native: the component only adds field clothes.
- N G value accessor with forward ref plugs it into forms.
- Form owned value and disabled state live in signals.
- Boolean attribute transform for required; name is forwarded.
- A real label with a for attribute, and visible Required text.
- The spec calls the accessor methods and dispatches native events.

Next, video forty builds S D sitebar, the light bar on public pages, with a host directive that reacts to scrolling.
