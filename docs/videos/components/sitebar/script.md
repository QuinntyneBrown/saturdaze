# 40 · Coding sd-sitebar: a public top bar with a host directive

The sitebar is the lighter top bar on public pages: the Saturdaze wordmark on the left, a Sign in link and an optional Create your account button on the right. When the page scrolls, it fades in a frosted backdrop. You will build S D sitebar from its real source, with a close look at host directives, and then walk through its spec file.

## Where it is used

The sitebar is rendered once, by the application shell. Open the app template: when the route's shell data says site, the shell renders S D sitebar and binds its call to action input to a computed signal from the route data. In the routes file, the landing page and the shared weekend page set call to action to true, and the legal page leaves it off. So the same bar shows the sign up button where it helps, and hides it where it would distract.

## The decorator

Open the file called sitebar dot T S. The decorator uses the selector S D sitebar, standalone, On Push, and imports two things: the library's own button component and router link.

Then there is a line worth pausing on: host directives, with the scrolled directive in it. A host directive is applied to the component's host element as if the consumer had written its attribute, but nobody has to remember to. The top bar uses the same directive, so the scroll behaviour lives in exactly one place and is composed into both bars.

The host block adds the class called sitebar, so the host is the mock's block element, and toggles a modifier class, sitebar dash dash C T A, whenever the call to action input is true. The stylesheet reads that class later. This used to be a reflected C T A attribute on the host. A D R nine now records the rule: inputs stay inputs, and state that C S S or a locator needs goes on the host as a class or as A R I A state. The data scrolled attribute is the one exception, because the mock sets it too.

## The input

The class body is a single line. The input is called C T A, made with the input function, defaulting to false, with the boolean attribute transform. That transform lets a consumer write the bare attribute, and turns the empty string into true. There is no output, no model and no local state: the bar is fully driven by one input and the directive.

## The scrolled directive

Since the behaviour comes from the directive, let's open scrolled dot T S next to it. Its selector is S D scrolled, and its host binding sets a data scrolled attribute from a signal called scrolled.

It uses the inject function to get N G zone and destroy ref, instead of constructor parameters. In the constructor it calls after next render, so the code only runs in the browser after the first render, which keeps server rendering safe. Inside, an update function compares window scroll Y against four pixels, and only when the state flips does it re-enter the zone and set the signal. The scroll listener itself is registered outside Angular's zone, and passive, so scrolling never triggers change detection. Destroy ref removes the listener when the bar goes away.

That is a good pattern for any high frequency browser event: listen outside the zone, and write a signal only when the derived state actually changes.

## The template

The template is a div with the class sitebar inner. Inside it, the brand is an anchor with router link to the root, holding a span with the class brand mark, marked aria hidden because it is decoration, followed by the wordmark text.

The actions div holds an anchor with the class sitebar link and router link to sign in. Then an at if on the call to action renders S D button with variant primary, size small, and an href to create account, so the button renders as a real link. Sign in stays a plain link because it is navigation, not an action.

## The styles

Open sitebar dot S C S S. The host is sticky at the top, uses the z index top bar token and the layout top bar height token, and transitions background and box shadow with duration normal and curve easy ease.

When the host has the data scrolled attribute, it gets a background mixed from neutral background two at eighty six percent with transparent, a ten pixel backdrop blur, and a one pixel shadow line in neutral stroke two.

The inner container uses layout content max width and layout gutter, so the bar lines up with the page content at every breakpoint without a single media query of its own. The brand mark is a gradient built from brand background two, palette sun background one and brand background.

Finally, below three hundred and eighty pixels, the gap tightens, and when the host has the C T A modifier class the Sign in link is hidden, because the hero on those pages repeats Sign in. That is why the input is mirrored to a host class: the stylesheet can react to it with a plain host selector.

## The spec file

Open sitebar dot spec dot T S. The setup provides the router with no routes, creates the bar, detects changes, and awaits when stable.

"creates the public bar with the wordmark linking to the landing page" checks the sitebar class, the brand link to the root, the wordmark text, the aria hidden brand mark, and no data scrolled attribute yet.

"offers Sign in and no CTA by default" checks the sign in link, that no button renders, and that the host has no C T A class. "adds the Create your account CTA when asked" sets the input and checks the host class and a link to create account carrying the primary and small button classes. "labels the CTA with its text" checks its visible label.

And "fades in its backdrop once the page scrolls" redefines window scroll Y to thirty, dispatches a scroll event, and checks the host now has data scrolled. Notice it resets scroll Y afterwards, so later tests are not affected by the shared window.

## Pitfalls

- Adding the scrolled attribute by hand on the bar. It is already a host directive.
- Listening to scroll inside the zone, or setting the signal on every event. Both cause needless change detection.
- Hiding Sign in on small screens without a replacement. The bar relies on the hero repeating it when the call to action is shown.

## Recap

Things to remember.

- One boolean input with the boolean attribute transform, mirrored to a host class for C S S.
- Host directives compose shared behaviour, like scrolled, without asking consumers.
- The directive listens outside the zone and writes a signal only on change.
- Layout tokens align the bar with the page at every width.
- The spec fakes window scroll Y and cleans up after itself.

Next, video forty one builds S D skeleton row, the shimmering placeholder shown while a weekend loads.
