# 02 · Coding sd-auth-card: four slots and a centred head

In this video you build the S D auth card, the white card that frames every signed out form. Sign in, create account, reset password and verify email all put one or more auth cards inside the auth shell. The card draws a heading, an optional subtitle, an optional round disc above them, the form itself, and an alternative line at the bottom, such as already have one, sign in. It is a short component, and that makes it a clean lesson in content projection: one default slot and three named slots, each declared once.

## The decorator

Open the auth card file in the components library. The selector is S D auth card, the component is standalone, and change detection is OnPush. It imports nothing at all, because everything it renders is either plain markup or projected by the page.

The host block gives the element the class auth card, which is the block class from the mock stylesheet, so the host itself is the card. Following A D R nine, end to end locators find the same class in the static mock and in the app. Notice what the host does not carry. Inputs stay inputs: the title and the center flag are not mirrored back onto the element as attributes. Nothing read them, and a reflected title would give the whole card a native browser tooltip. Only classes and A R I A state belong on the host, and A D R nine records that rule. Center shows up where it matters, as a modifier class in the template.

## Inputs

The class body is three lines. The card title is a string input with an alias of title, so pages write title equals, while the class field keeps a distinct name. The subtitle is a plain string input with an empty default. And center is a boolean input with the boolean attribute transform, so the reset password page can write the bare word center on its check your email card.

That is the whole class. No outputs, because the form inside the card owns its own submit. No computed signals, because there is nothing to derive. When a component only lays out content, keep the class this small and let the page own the behaviour.

## The template

The template opens with the head. It is a div with the auth card head class, and a class binding adds the center modifier when the center signal is true. Inside the head, in order, there is the disc slot, the h1 with the title, the subtitle paragraph inside an if block, and a slot called head for anything that belongs under the subtitle, like the masked email chip on the check your email card.

The title is an h1, because on these pages the card title is the page title. That matters for screen reader users, who jump between headings.

After the head comes a plain ng content with no select. This is the default slot, and it receives everything without a slot attribute, which is the form. Last is the alt paragraph, which wraps the alt slot.

Each slot appears exactly once in the template. That is the rule from the project instructions: never repeat a slot in different branches, because Angular projects each node into only one place.

## The styles

The host is a column with an eighteen pixel gap, a neutral background one fill, a neutral stroke two border, an extra large border radius and shadow sixteen. All tokens are read by role. The title uses the hero seven hundred font size and bold weight, and the subtitle and alt line use neutral foreground two.

Two details are worth copying. First, the alt paragraph hides itself with the has selector when nothing is projected into it, so a card without an alt line leaves no gap. Second, the respond to mixin raises the padding to thirty two pixels from the tablet breakpoint, using the shared Sass breakpoints instead of a raw media query. To give the projected disc a little space, the stylesheet reaches into the slot with ng deep. Use that sparingly, and only for content you project yourself.

## The unit tests

The spec file creates the auth card directly, calls detect changes, and keeps a reference to the host element. It also declares a small host component that projects a disc, a head paragraph, a form and an alt link.

The first test, creates the card with an h1 and an alt line, checks the defaults: the auth card class, an h1 inside the head, no subtitle, the alt paragraph present, no center modifier, and an empty title.

The second test, renders the title and subtitle, sets both inputs with set input on the component ref and reads the rendered text back.

The third test, centres the head when asked, sets center to true and checks the modifier class on the head. Every assertion reads rendered output, never a host attribute.

The last test, projects disc, head, form and alt into their slots, renders the host component and checks the order: the disc is the first child of the head, the head slot is the last child, the form sits directly inside the card, and the alt link lands in the alt paragraph. That one test is the guard for the whole projection contract.

## Pitfalls

Watch for three things. Don't wrap several slotted nodes in one if block on the page, or they lose their slot. Don't add a second h1 inside the projected form. And don't remove the boolean attribute transform from center, or the bare attribute stops working.

## Recap

Things to remember.

- The host is the card, with the mock's auth card class.
- Three inputs: an aliased title, a subtitle, and a center flag with the boolean attribute transform.
- Four slots, disc, head, default and alt, each declared once.
- The alt line hides itself when empty.
- One projection test guards the slot order.

Next, in video three, we build the S D auth shell, the page that holds these cards.
