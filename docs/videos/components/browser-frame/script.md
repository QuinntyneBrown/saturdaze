# 08 · Coding sd-browser-frame: inject, a signal, a computed and a ResizeObserver

In this video you build the S D browser frame, a small drawing of a browser window. The landing page uses it for its hero: a live miniature of the Weekend screen, built from real day and block components, laid out at a fixed width and scaled down to fit whatever space the hero gives it. It is the first component in the series that measures the D O M, so it shows how to combine inject, a local signal, a computed signal and after next render, and why it does not need an effect.

## The decorator

Open the browser frame file in the components library. The selector is S D browser frame, the component is standalone, change detection is OnPush, and it has no imports, because everything inside the view is projected.

The host block starts with the class browser frame, the mock's block class, and aria hidden equals true. The frame is decorative: the miniature repeats what the landing page already says in words, so screen readers skip it. The url input is not mirrored as an attribute: inputs stay inputs, and only classes, A R I A state and, here, layout styles go on the host, as A D R nine records.

Then come three style bindings that set custom properties on the host. The first, underscore s, is bound to the scale signal. The second and third, underscore w and underscore h, are bound to the frame width and frame height inputs, with a pixels unit in the binding. Writing the unit in the binding, rather than concatenating a string, keeps the input a plain number. The stylesheet reads these three properties, so all the geometry is driven by signals without touching the element's style from code.

## Inject and the inputs

In the class body, two private fields use the inject function: the host element reference, typed as an element ref of an H T M L element, and destroy ref. Inject is the modern alternative to constructor parameters. It keeps the constructor free for setup, and it works the same in field initialisers, which is where you want dependencies declared.

There are three inputs. The url is a string defaulting to saturdaze dot app slash weekend. The frame width defaults to seven hundred and twenty, and the frame height to three hundred. Both are numbers, and because the landing page never passes them, they need no transform. If a page ever wrote them as plain attributes, you would add the number attribute transform.

## Local state and the computed scale

Next, a private signal called host width, starting at zero. This is local state: it belongs to the component, it changes when the container resizes, and nothing outside needs it.

The scale is a protected computed signal. It reads the host width; if the width is greater than zero, it returns the smaller of one and the width divided by the frame width, otherwise it returns one. Two rules are encoded there. Never scale up, and if nothing has been measured yet, show the composition at full size rather than at zero. Because it is a computed, it re runs only when the host width or the frame width input changes, and the host binding picks up the new value automatically under OnPush.

## Measuring with after next render

The constructor registers an after next render callback. That callback runs once, in the browser, after Angular has rendered the component, which is exactly when the element has a real size. It never runs during server side rendering, so the code can touch the D O M safely.

Inside, it reads the element's client width and sets the host width signal. If the resize observer A P I does not exist, it stops there. Otherwise it creates a resize observer whose callback sets the host width from the first entry's content rectangle, falling back to the client width, and observes the host. Finally it registers the observer's disconnect with destroy ref, so the observer is cleaned up when the component is destroyed.

Notice what is missing: there is no effect. An effect is for reacting to signal changes with side effects. Here the side effect, observing size, has to start once after rendering and feed a signal, not react to one. After next render plus a signal is the right shape, and the computed does the rest.

## The template and styles

The template is short. A bar holds three dot spans and a url span showing the url signal. Below it, a view div contains a scale div with a single default ng content slot.

In the stylesheet, the view's height is the frame height multiplied by the scale, so the outer box shrinks with the miniature. The scale div is absolutely positioned, sized to the frame width and height, and transformed with scale, from the top left corner. Each custom property has a fallback in the var call. The colours are tokens read by role: neutral background one and three for the window and the bar, neutral stroke two for borders, shadow sixteen for the lift.

## The unit tests

The spec creates the frame, detects changes, and awaits when stable before reading the host. A host component projects a paragraph reading Weekend.

Creates as a decorative browser chrome checks the class, aria hidden and the three dots.

Shows the url in the bar checks the default url in the rendered bar, then sets a new url with set input on the component ref and checks the bar again.

Lays the composition out at the frame size reads the underscore w and underscore h custom properties from the host style, seven hundred and twenty and three hundred pixels, then sets the frame width and height inputs and checks the new values.

Does not scale up when the host has no measurable width checks that the scale property is one. In the test environment the element has no layout, so the width is zero, and this test proves the computed's fallback.

Projects the composition into the scaled view checks the projected paragraph lands inside the scale div.

## Pitfalls

A few pitfalls. Don't measure in the constructor or in a field initialiser; the element has no size yet. Don't forget to disconnect the observer. Don't use an effect to start the observer. And don't let the scale exceed one, or the miniature will blur.

## Recap

Things to remember.

- Inject the element ref and destroy ref as fields.
- A private signal holds the measured width; a computed derives the scale.
- After next render starts the resize observer once, in the browser only.
- Destroy ref disconnects it; no effect needed.
- Host style bindings feed custom properties that the stylesheet uses.

Next, in video nine, we build the S D button, the one button behind every action in the app.
