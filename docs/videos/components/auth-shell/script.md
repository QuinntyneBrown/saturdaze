# 03 · Coding sd-auth-shell: a page frame with router links

In this video you build the S D auth shell, the frame around every signed out screen. Sign in, create account, reset password and verify email each start with an auth shell and put their auth cards inside it. Those routes use the bare shell from A D R nine, so there is no top bar and no bottom nav: the auth shell is the whole page. It draws the brand lockup at the top, the projected card in the middle, and a footer with links to the terms, the privacy section and back to the home page. It is the smallest component so far, with one input, but it shows two useful patterns: using the router inside a library component, and turning a boolean input into a modifier class on the host.

## The decorator

Open the auth shell file in the components library. The selector is S D auth shell, the component is standalone, change detection is OnPush, and it imports one thing, router link, because the brand and the footer links are real in app links.

The host block gives the element the class auth, the block class from the mock stylesheet. Then one class binding adds the auth stack modifier when stack is true. The class is what the styles and the end to end locators use, and it is the only thing the input puts on the host. There is no stack attribute: inputs stay inputs, and only classes and A R I A state belong on the host, as A D R nine records. Nothing ever read a reflected attribute.

## The input

The class has one line: stack is a boolean input with the boolean attribute transform. Its doc comment says it all: top aligned, for several stacked cards, instead of vertically centred. A page can write the bare word stack on the element, and the transform turns it into true. The mock's sign in page uses the stack modifier; the app's pages currently use the centred default.

The host bindings read the stack signal directly. Under OnPush that is all you need: when the input changes, Angular marks the component dirty and updates the class. There is no need for a setter, a host binding decorator, or a computed signal for something this simple.

## The template

The template is a single column div. First comes the brand link. It is an anchor with router link pointing at the root, holding a brand mark span and the word Saturdaze. The brand mark is pure decoration, a gradient square, so it carries aria hidden equals true. The visible word gives the link its accessible name.

Next is a plain ng content with no select. The page projects its auth cards here, between the brand and the footer.

Last is the footer paragraph with three soft links: Terms goes to the legal page, Privacy goes to the legal page with a fragment of privacy, and Back to Saturdaze goes home. Between them are middle dots, each in a span with aria hidden, so a screen reader announces three links and not the punctuation.

Using router link here, instead of plain hrefs, keeps navigation inside the single page app while the anchors still render a real href. That also means any test that renders the shell must provide the router.

## The styles

The host is a grid that centres its content with place items center, at least one hundred small viewport heights tall, so the card sits in the middle of the visible screen even on phones with browser chrome. The side padding is the layout gutter token, which grows at the tablet and desktop breakpoints without a media query here.

When the host has the auth stack class, place items changes to start center and the top padding grows, so several cards stack from the top. The column is capped at four hundred and forty pixels.

The brand mark is a layered background: two radial gradients over the brand background, built from brand background two and the palette sun background token. The footer uses the base two hundred font size and neutral foreground three. Every colour is a token read by role, as A D R thirteen requires, except one faint literal hairline in the mark's inset shadow.

## The unit tests

The spec file configures the testing module with the auth shell, a small host component, and provide router with an empty route list, which router link needs. A helper called foot links collects the soft links in the footer.

The first test, creates the centred column with the brand lockup, checks the auth class, that the brand link points at the root and reads Saturdaze, that the brand mark is aria hidden, and that the stack modifier is absent by default.

The second test, links Terms, Privacy and Back in the footer, checks the three link texts, the three hrefs, including the legal page with the privacy fragment, and that there are exactly two hidden dots.

The third test, top aligns stacked cards, sets stack with set input on the component ref and checks the modifier class on the host.

The last test, projects the card between the brand and the footer, renders the host component and checks the children of the column in order: the brand first, the projected card second, the footer last.

## Pitfalls

A few pitfalls. Forgetting provide router in a test that renders the shell makes router link fail. Replacing router link with plain hrefs reloads the whole app on every click. And don't drop aria hidden from the decorative mark or the dots, or screen readers read noise.

## Recap

Things to remember.

- The host is the page, with the mock's auth class.
- One boolean input, stack, turned into a modifier class, never a host attribute.
- Router link for in app links, and provide router in the spec.
- Decoration is aria hidden; the visible text names the links.
- Layout tokens and the small viewport height keep the card centred.

Next, in video four, we build the S D avatar, and meet our first computed signal.
