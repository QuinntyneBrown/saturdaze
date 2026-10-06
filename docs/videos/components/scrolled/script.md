# 35 · Coding sd-scrolled: the [sdScrolled] directive, a signal and no template

This video is different: the scrolled directive has no template and no styles. It is a tiny attribute directive that sets a data scrolled attribute on its host once the window has scrolled more than four pixels, and removes it again at the top. The top bar and the site bar use it to fade in their translucent backdrop. It is small, but it packs several modern Angular ideas: a writable signal read by a host binding, after next render, inject with destroy ref, and running a listener outside the zone. In this video you will build it from its real source and then walk through its six unit tests.

## Where it is used

You will not find the directive's attribute in any page template. Instead, two components apply it as a host directive. Open the top bar file: its component metadata lists host directives with Scrolled in it. The site bar does the same. Every top bar and site bar therefore gets the behaviour automatically, and the page never has to remember it.

Then each one styles the state. In the top bar style sheet, a host selector with the data scrolled attribute sets a background that mixes neutral background two at eighty six percent with transparent, adds a ten pixel backdrop blur, and draws a one pixel shadow line in neutral stroke two.

## Step one: the decorator

Create the scrolled file. This time the decorator is Directive, not Component. The selector is the attribute S D scrolled, in square brackets, and it is standalone.

There is one host binding: the data scrolled attribute is an empty string when the scrolled signal is true, and null when it is false. Null removes the attribute entirely, so the style hook is a simple presence check. Why an attribute instead of a class? The best practices file explains it: the mocks and the app share one hook, and an attribute selector reads naturally as state.

Directives don't have change detection settings, but the host binding reads a signal, so Angular knows exactly when the attribute needs updating.

## Step two: injection and state

The class injects two things with the inject function: N G zone, and destroy ref. Then it declares a public, read only field called scrolled, a writable signal starting at false. It is public on purpose: a host component that injects the directive can read the scrolled signal too.

This is the right place for a plain signal. The state is local, it is set from an event, and nothing derives from anything else, so there is no computed and no input at all.

## Step three: the constructor

All the work happens in the constructor, inside after next render. That callback runs once, after the first render, and only in the browser. That matters: on the server there is no window, so touching window in the constructor would break server side rendering, and reading the scroll position before the first render would be meaningless anyway.

Inside, a small update function computes the next value: is window scroll Y greater than four? Only if that differs from the current signal value does it set the signal, and it does so inside zone run, so Angular notices. Then the directive adds a passive scroll listener on the window, wrapped in run outside Angular. This is the key performance trick. Scroll events fire many times per second; outside the zone they don't trigger change detection. Only the rare moment when the state flips re enters the zone.

Next, it registers cleanup with destroy ref on destroy, removing the scroll listener. And finally it calls update once, so a page that loads already scrolled down gets the right state immediately.

Notice there is no effect here. The directive doesn't react to a signal; it reacts to a D O M event, so a listener is the right tool. And the four pixel threshold avoids flicker from tiny bounces at the top of the page.

## Unit tests

Open the spec file. A helper called set scroll Y redefines the window's scroll Y property, because J S D O M doesn't actually scroll. Each test starts at zero, compiles a host component with a div carrying the directive and a probe class, runs detect changes, and waits for when stable so that after next render has run. After each test, the scroll position resets.

"Creates without data scrolled at the top of the page" checks the probe exists and has no attribute.

"Sets data scrolled once the window scrolls past the top" sets scroll Y to ten, dispatches a scroll event on the window, runs detect changes, and expects the empty attribute.

"Ignores the first few pixels" does the same with four and expects no attribute: the threshold is strictly greater than four.

"Clears data scrolled when scrolled back to the top" goes to forty and then back to zero.

"Reads the initial scroll position on first render" sets the scroll first and then creates a fresh fixture, proving the initial update call.

And "removes the window listener when destroyed" spies on remove event listener, destroys the fixture, and expects a call for the scroll event. That test guards against a leak that would otherwise be invisible.

## Pitfalls

- Touching window in the constructor instead of after next render.
- Listening inside the zone, which runs change detection on every scroll event.
- Forgetting to remove the listener on destroy.
- Expecting it to track a nested scroll container; it only watches the window.
- Sprinkling the attribute in page templates instead of using host directives.

## Recap

Things to remember.

- A directive with no template: one signal, one host attribute binding.
- After next render for browser only setup, destroy ref for cleanup.
- A passive listener outside the zone; re enter only when the state flips.
- Apply it with host directives and style the data scrolled attribute.
- Six tests cover the threshold, the initial read and the cleanup.

Next, in video thirty six, we build S D section, the titled block that groups content on every screen.
