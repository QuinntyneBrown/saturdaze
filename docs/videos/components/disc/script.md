# 20 · Coding sd-disc: an icon in a coloured circle

In this video you will build S D disc, the smallest component in the series so far: an icon inside a coloured circle. You see it at the start of list rows on the family page and the weekend page, in the calendar and errand dialogs, and in extra large form at the top of the verify email and reset password screens. Other components reuse it too: the empty state, the menu, and the day header's weather disc. It is a great example of a component that is almost all host bindings and tokens, with one computed signal.

## Types first

Open disc dot T S. Before the decorator, the file exports two union types. Disc tone lists nine tones: default, accent, primary, warn, sun, sky, leaf, indoor and surface. Disc size lists small, medium, large and extra large, written as S M, M D, L G and X L. Exporting these types gives consumers autocompletion and lets the compiler reject a typo like tone equals sunny because this workspace turns on strict templates.

## The decorator and host bindings

The selector is S D disc, the component is standalone, it imports the icon component, and change detection is On Push.

The host object is where most of the work happens. First, the static class disc, the B E M block from the mock stylesheet, so the component and the design reference share class names, as A D R nine requires. Second, a static aria hidden set to true. The disc is decorative: the text next to it carries the meaning, so screen readers should skip it. Because the value never changes, it is a plain host attribute, not a binding.

Then come the modifier classes. Each one is a class binding that compares a signal to a literal: disc small when size is S M, disc large when size is L G, and one binding per tone, from disc accent to disc surface. The defaults, medium and default tone, have no class at all, which matches the mock, where the plain disc class is the medium neutral disc.

Finally, notice what the host does not carry: the icon, tone and size inputs are not mirrored back onto host attributes. Inputs stay inputs; only classes and ARIA state go on the host. Nothing read those attributes, so A D R nine now records that rule.

## Inputs and one computed signal

The class body is short. There are three signal inputs, created with the input function: icon, defaulting to sparkle; tone, typed as disc tone and defaulting to default; and size, typed as disc size and defaulting to medium. None of them is required, because every disc has a sensible default, so input dot required would only make consumers write more. And none needs a transform: they are strings, not booleans or numbers coming from attributes.

The one piece of derived state is a protected computed signal called icon size. It returns twenty six pixels for extra large, sixteen for small, and twenty otherwise. That mirrors the mock rule that enlarges the icon inside the extra large disc. Using computed means the value is recalculated only when size changes, and it is protected because only the template reads it.

## The template

The template is a single line: an S D icon whose name is bound to the icon signal and whose size is bound to icon size. There is no wrapper element. The host itself is the circle, which keeps the D O M flat and lets a parent add classes, like the day component's weather disc class, straight onto the circle.

## Styles: fill and ink pairs

Open disc dot S C S S. The host is an inline flex circle, thirty six pixels by default, with neutral background three and neutral foreground two. The size modifiers only change width and height.

Each tone sets a background and a colour, and they always come in designed pairs: status success background one with status success foreground one for accent, brand background two with brand foreground two for primary, status danger for warn, and the sun, sky, leaf and indoor palette pairs. The theme guarantees each foreground passes contrast on its own background, so contrast is correct by construction. Surface is the exception: neutral background one with an inset ring in neutral stroke two. Every rule targets the host with the colon host selector, and there is not one hex value in the file.

## The spec file

The spec file creates the disc with TestBed, runs detect changes, and keeps three small helpers: one finds the inner icon, one reads the path data of the glyph it draws, and one reads the icon's size custom property.

Creates a decorative disc with the sparkle glyph checks the defaults: aria hidden true, the sparkle glyph actually drawn, and a host whose only class is disc. Forwards the icon name sets the icon input to fork with fixture dot component ref dot set input and checks that the fork glyph is drawn. The tests assert rendered D O M, not attributes.

Mirrors every tone to a host class loops over all eight non default tones, so adding a tone to the type without a class binding fails the test. Mirrors the size to a host class and scales the glyph with it walks through small, large and extra large, checking the class and the icon size, sixteen, twenty and twenty six pixels. It also checks that the large class is removed when the size moves on, which proves the bindings are reactive, not set once.

## Pitfalls

- Don't give a disc meaning on its own; it is aria hidden, so put the meaning in nearby text.
- Don't use a fill token without its paired ink.
- When you add a tone, update the type, the host binding and the stylesheet together.

## Recap

Things to remember.

- Exported union types make the inputs type safe.
- Host class bindings that compare signals replace a hand built class string.
- Static aria hidden marks the disc as decorative.
- One computed signal scales the glyph with the size.
- Tones are fill and ink token pairs, so contrast is correct by construction.

Next, in video twenty one, we build S D empty, the empty state that puts an extra large disc above a title and a call to action.
