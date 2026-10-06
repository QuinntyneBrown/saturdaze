# 48 · Coding sd-toggle: a switch built on a real checkbox

S D toggle is the on and off switch: a pill shaped track with a sliding thumb and an optional label. In the app you meet it in two places. On the sign in page it is the "Remember me" switch, bound with form control name. On the family page, each preference in the list has a toggle in the trailing slot, with no visible label, bound with N G model. In this video you will build it from its real source, see why it is a real checkbox underneath, how a signal, an effect and a small flag decide who owns the checked state, and then read its spec.

## The decorator

Open toggle dot T S. The doc comment states the design in one line: a real input of type checkbox with role switch, visually hidden, inside a label, so keyboard, focus and assistive technology come for free. You style a native control instead of rebuilding one.

The selector is S D toggle, standalone, with a template and style file, and On Push change detection. There is no host object at all. The host has no class, because the B E M block lives on the inner label, and it mirrors none of the inputs as attributes. Inputs stay inputs: the checked and disabled state live on the real checkbox, where assistive technology reads them, and A D R nine records the rule that only classes and ARIA state ever go on a host.

Like the text input, the providers array registers the class as an N G value accessor with forward ref and multi true. That is why both form control name and N G model work.

## Inputs and local state

There are three inputs. Label is a string for the visible text. S R label is a string used as the accessible name when there is no visible label, which is exactly the family page case. And checked is a boolean input with the boolean attribute transform, so you can write the bare word checked in a template.

Then two writable signals: internal checked, the real state the template shows, and disabled, which only the form sets.

## Who owns the state

The constructor holds one effect. It reads the checked input and, if the form has not bound yet, copies it into internal checked. As soon as write value runs, it sets form bound to true, and from then on the static input is ignored.

That is why this is an effect and not a computed signal. Internal checked has three writers: the input, the form, and the user. A computed signal can only have one source of truth. And form bound is a plain field, not a signal, because the effect should not re run when it flips; it only needs to read it.

Handle change reads the checkbox's checked property, writes internal checked, then calls on change with the new value and on touched. Write value sets form bound and stores the value, turning null into false. Set disabled state writes the disabled signal.

## The template

The template is one label element with the class toggle. Inside it, the input has the class toggle input, type checkbox, and role switch, so screen readers announce "on" and "off" instead of "checked". Its checked and disabled properties bind to the two signals. Its aria label binding says: if there is a visible label, null; otherwise the S R label, or null if that is empty too. A control never gets two names. The change event calls handle change.

After the input comes an empty span with the class toggle track, which draws the switch, and then, inside an at if, a span with the class toggle label holding the visible text. Because everything is inside the label element, clicking the text toggles the switch too.

## The styles

The host is display contents, so the label lays out as if the host weren't there.

The input is the clever part. It is positioned absolutely over the whole label with inset zero, sits above it with z index one, and has opacity zero. It is invisible, but it is still the element you click, focus and tab to.

The track is forty four by twenty four pixels, border radius circular, filled with neutral stroke one, and its after pseudo element is the twenty pixel thumb with shadow four. Both transition with duration normal and curve easy ease. The states use the sibling selector: when the input is checked, the track turns status success background three and the thumb moves twenty pixels right. When the input is focus visible, the track gets the focus ring built from stroke width thick and color stroke focus two. When it is disabled, the track drops to half opacity. Be aware that the thumb's fill is a literal white rather than a token; it is the one value here not read by role.

## The spec

Open toggle dot spec dot T S. The setup creates the component, keeps the instance and host, and defines a helper that finds the toggle input.

"Creates an unchecked switch inside its label" checks the structure: the input is inside the label, has type checkbox and role switch, starts unchecked, and there is a track but no label element.

Two tests cover naming. "Renders the visible label and drops any aria-label" sets both label and S R label and proves only the visible one survives. "Uses srLabel as the accessible name when there is no visible label" checks the aria label.

Two tests cover ownership. "Seeds the state from the static checked input" sets checked true and false with set input. "Lets a bound form take over from the static input" calls write value true, then sets the checked input to false, and expects the switch to stay on, because the form now owns it.

The last two cover the form contract. "Reports a user toggle to the form and marks it touched" dispatches a change event and checks both spies. "Disables the switch from the form" calls set disabled state and checks that the inner checkbox is disabled.

## Pitfalls

- Don't remove the native checkbox to style a div. You would lose keyboard, focus and announcements.
- Always give an unlabelled toggle an S R label.
- The doc comment mentions a changed output, but the class declares none. Listen through the form or N G model change, as the family page does.

## Recap

Things to remember.

- A real checkbox with role switch, hidden but clickable, inside a label.
- Exactly one accessible name: the visible label or the S R label.
- The static input seeds the state; once a form binds, write value wins.
- An effect plus a plain flag, because the state has several writers.
- Styles key off checked, focus visible and disabled on the real input.

Next, in video forty nine, we build the S D tooltip directive and the panel it renders into a C D K overlay.
