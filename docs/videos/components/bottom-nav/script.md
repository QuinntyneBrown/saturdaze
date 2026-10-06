# 07 · Coding sd-bottom-nav: a navigation landmark and a protected offset

In this video you build the S D bottom nav, the floating pill of four destinations that sits at the bottom of the screen on phones: Weekend, Ideas, Past and Family. The app shell renders it exactly once, below the main element, and only for the app shell routes. From seven hundred and twenty pixels wide it hides itself, and the top bar takes over. The component is small, but its stylesheet holds one of the most carefully argued lines in the repository, the bottom offset described in A D R five. You will build the component, understand that rule, and see what the spec file proves.

## The decorator

Open the bottom nav file in the components library. The selector is S D bottom nav, the component is standalone, change detection is OnPush, and it imports two things: the icon component and router link.

The host block makes the element itself the navigation landmark. It has the class bottom nav, the mock's block class, a static role of navigation, and an aria label of Primary. Assistive technology lists it as the primary navigation, and because the role sits on the host, there is no extra wrapper element. Notice that the active input is not mirrored onto the host as an attribute. Inputs stay inputs: only classes and A R I A state go on the host, as A D R nine records, and the active state already shows up where it matters, as aria current on the link.

## The input and the items

The class has one input, active, typed as a nav key or null, defaulting to null. The nav key type is a union of weekend, ideas, past and family, so the shell can only pass one of the four real destinations. The shell reads it from route data and binds it.

The items come from a shared constant called nav items, in a shared nav key file. The bottom nav assigns it to a protected read only field. Notice that this is not a signal. The list never changes at runtime, so a plain constant is the honest choice. Wrapping fixed data in a signal adds nothing. The same constant feeds the top bar, so the two navigations can never disagree about labels, icons or routes.

Each item has a key, a label, an icon and a route. Weekend uses the home icon, Ideas uses sparkle, Past uses star, and Family uses user.

## The template

The template is a for loop over the items, tracked by key. Tracking by a stable key lets Angular keep each link element instead of recreating it.

Each item is an anchor with the bottom nav item class, a data nav attribute set to the key, and router link bound to the route. The current page is marked with aria current equals page when the active input equals the item's key; otherwise the binding returns null and the attribute disappears. That is the state the mocks use too, so the end to end locators and the styles key off the same attribute. Inside, a span with the bottom nav icon class holds the icon at twenty two pixels, and then the label text.

## The offset rule

Now the stylesheet, starting with the most important line. The host is position fixed, twelve pixels in from each side, with a z index from the bottom nav z index token. Then comes the bottom property. It is twelve pixels plus the larger of two values: the safe area inset at the bottom, and a custom property called dash dash S D chrome bottom.

A D R five explains why. On iPhones, two different things can cover the bottom edge: the home indicator, which the safe area inset measures, and Safari's own toolbar, which grows and shrinks as you scroll. No C S S unit can measure only the bottom toolbar, so a small script in main dot T S uses the visual viewport A P I to measure it and writes the chrome bottom property on the root element before Angular starts. The two values are not added, because when Safari's toolbar is showing it already covers the home indicator zone. Taking the maximum and adding a twelve pixel floor keeps the pill visible in every state.

The comment above the line says do not simplify without re reading A D R five. Take that literally. The A D R lists four pure C S S attempts that failed, and a regression test in the end to end suite checks the rule is still in place.

## The rest of the styles

The rest is ordinary. The pill is capped at four hundred and forty pixels and centred, its height is the layout bottom nav height token, and it is a four column grid. The background, border, circular radius and shadow twenty eight are all tokens read by role.

The active item is styled through the attribute selector on aria current equals page: the text turns to neutral foreground one, and the icon gets a pill of brand background two with brand foreground one. Styling the A R I A state, rather than a separate active class, means the visual and the accessible state cannot drift apart.

Finally, the respond to mixin hides the whole host from the tablet breakpoint.

## The unit tests

The spec file configures the testing module with the bottom nav and provide router, which router link needs, creates the component and detects changes. A helper collects the item anchors.

Creates the primary navigation landmark checks the class, the navigation role, and the Primary label.

Renders exactly four items in the fixed order checks the data nav keys, the visible labels and the hrefs, in that order. Draws each item glyph at twenty two pixels checks that the four glyphs are actually drawn in each icon's S V G, and that each icon's size custom property is twenty two pixels.

Marks the active destination with aria current is the behaviour test. With no active input there is no aria current at all. After set input on the component ref with ideas, exactly one link has aria current page, and it is Ideas. Setting active back to null removes it again.

The offset rule is deliberately not unit tested here; it is guarded by the bottom nav clearance regression spec in the end to end suite. Run it whenever you touch the navigation.

## Pitfalls

A few pitfalls. Never simplify the bottom calc, and never add the two insets together. Don't add a second active class; style aria current. Don't render the nav per page; the shell owns it. And don't wrap the constant items in a signal.

## Recap

Things to remember.

- The host is the navigation landmark, with role navigation and the label Primary.
- One nullable input, active, typed by the nav key union.
- Shared, constant items, tracked by key.
- Aria current marks the page and drives the active style.
- The bottom offset follows A D R five, with a regression test guarding it.

Next, in video eight, we build the S D browser frame, with a resize observer, a signal and a computed scale.
