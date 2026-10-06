# 50 · Coding sd-top-bar: the sticky desktop navigation

S D top bar is the sticky bar at the top of the app on tablets and desktops: the Saturdaze wordmark, the four primary links, and the account avatar. Below seven hundred and twenty pixels it hides and the bottom navigation takes over. It is rendered exactly once, in the app shell template, app dot H T M L, where the shell passes the active destination from route data, the signed in email, the avatar photo, and listens for account click to open the account menu. In this video you will build it, see how a host directive, a computed signal and an output work together, and walk through its spec.

## The decorator

Open top bar dot T S. The selector is S D top bar, standalone, On Push. The imports array brings in the avatar component and router link.

The new idea in this component is host directives. The decorator lists the scrolled directive there. A host directive is applied to the host element automatically, as if the consumer had written the attribute, but without the consumer having to know about it. The scrolled directive listens to window scroll outside Angular's zone and writes a signal, and its own host binding sets a data scrolled attribute on the host once the page has scrolled more than four pixels. The top bar gets that behaviour by composition, not inheritance, and shares it with the site bar.

The host object gives the element the class topbar, the B E M block from the mocks, and nothing more. The active input is not mirrored onto the host as an attribute: inputs stay inputs, and the active state is expressed where it means something, as aria current on the active link. A D R nine records that rule.

## Inputs, output and derived state

The active input is a nav key or null. Nav key is a shared type, the union of weekend, ideas, past and family, defined next to an array called nav items in the shared folder, which both the top bar and the bottom navigation read. One source of truth means the two navs can never disagree about the four destinations.

Email is a string, and avatar source is a string or null. Then the output, account click, typed as an H T M L element. The doc comment explains why it emits an element and not just a click: the element anchors the account menu, which the app opens as a C D K overlay next to the button.

Inside the class, items is a protected reference to nav items, and initial is a computed signal: the email, or a question mark when the email is empty. The avatar component then takes the first character and upper cases it. Finally, on account is a small method that emits the event's current target through the output.

Notice the output function instead of an event emitter with a decorator: typed, light, and consistent with signal inputs.

## The template

The template opens with a div, topbar inner. First comes the brand link, router link to slash weekend, containing a span with the class brand mark, hidden from assistive technology because it is decoration, followed by the word Saturdaze.

Then a nav element with aria label Primary. Inside, an at for loop over the items, tracked by key. Each link has the class topbar link, a data nav attribute with the key, a router link to the item's route, and aria current set to page only when the active signal equals the item's key. That attribute is the accessible way to say "you are here", and as you will see, the styles use it too.

Last, the actions area holds a button with the class avatar button, type button, and aria label "Account menu". Its click calls on account with the event, and inside it the S D avatar shows the initial or the photo in the primary tone.

## The styles

The stylesheet starts by using the breakpoints partial. The host is display none, sticky at the top, with z index top bar, height layout top bar height and a transparent background. At the very end, the respond to tablet mixin switches the host to display block. That is how the bar hides on phones without any script.

When the host has the data scrolled attribute, it fades in a background that mixes neutral background two at eighty six percent with transparent, a ten pixel backdrop blur, and a one pixel line in neutral stroke two.

The inner row is constrained by layout content max width and padded by layout gutter, so it lines up with every page and grows its padding with the responsive tokens.

The link is styled through aria current. When it equals page, the text becomes neutral foreground one, and an after pseudo element draws a two pixel underline in brand background. Hover styles sit inside a hover media query, so touch screens never get stuck hover states. The brand mark is a gradient of brand and sun tokens, with one literal R G B A inset shadow.

## The spec

Open top bar dot spec dot T S. Because the template uses router link, the testing module adds provide router with an empty route list. The setup also awaits when stable, so the router links have resolved their hrefs.

"Creates the bar with the wordmark linking home" checks the topbar class, the brand link's href of slash weekend, the text Saturdaze, the hidden brand mark, and that data scrolled is absent.

"Renders the four primary links in order" checks the nav's aria label, then the data nav keys, the labels and the hrefs as arrays, and that nothing is current yet.

"Marks the active destination with aria-current" sets active to past and expects exactly one current link, the Past link.

"Shows the account initial from the email" first expects a question mark, then sets an email and expects a capital Q.

"Emits the avatar button so the account menu can anchor to it" subscribes a spy to the output, clicks the button, and expects the spy to receive the button element itself.

"Fades in its backdrop once the page scrolls" defines window scroll Y as thirty, dispatches a scroll event, and expects the data scrolled attribute, testing the host directive through its consumer.

## Pitfalls

- Don't add a fifth link here. The four destinations are a fixed contract shared with the bottom navigation.
- Don't toggle visibility in TypeScript; the breakpoint mixin does it in C S S.
- Keep aria current as the single source of the active styling.

## Recap

Things to remember.

- Host directives compose shared behaviour, here the scrolled backdrop.
- One shared nav items array drives both navigations.
- A computed signal derives the initial; an output emits the anchor element.
- Aria current marks and styles the active link.
- Tests provide the router and await stability.

Next, in video fifty one, we build S D vote row, the family's thumbs up and down on a restaurant.
