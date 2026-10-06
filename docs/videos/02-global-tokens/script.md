# 02 · Global tokens: the raw values

In video one you learned that tokens come in three layers. This video opens the first one, the global layer. These are the raw values every theme is built from: colours, type, spacing, corners, motion and layout. By the end you will know what lives in each global file, why each ramp is shaped the way it is, and the one rule that keeps globals out of your components.

## Start with the contract

Before we open a single value, open `types.ts` in the tokens folder. It is the contract for the whole system, and it is the first file you should write when you build your own.

Every group of tokens is a TypeScript interface. Font sizes are an interface with seven keys. Border radii are an interface with six keys. Even the brand ramp is an interface, called brand variants, with sixteen numbered keys from ten to one hundred and sixty. When a global file declares its values, it annotates them with these interfaces. So if you forget a key, or misspell one, the compiler tells you immediately, long before a component renders with a missing variable.

At the bottom of the file, the full `Theme` type is the intersection of all these interfaces. Hold that thought; it matters in video three.

## The brand ramp

Open `brandColors.ts` in the global folder. It exports `brandSaturdaze`, a sixteen step coral ramp. Step ten is the darkest, almost black. Step one hundred and sixty is the lightest, a soft peach. This is the same shape Fluent uses for its brand ramps.

Why sixteen steps when the app only uses three? Because the ramp is not a list of colours you use. It is a scale that alias tokens pick from. Today, Saturdaze reads three steps. Step eighty, hex e0 78 56, is the primary button. Step seventy is a darker coral used for text, because it passes the double A contrast standard on the light coral fill. And step one sixty, the lightest, is that soft coral fill.

The comment in the file is honest about this. Those three values are the ones the mocks were drawn with, and the steps between are interpolated. That is a perfectly good way to start. If you later need a hover shade or a darker border, it is already in the ramp, and you only change an alias.

## Named colour palettes

Next, `colors.ts`. The comment at the top says it plainly: raw values only; themes map these onto alias tokens; components never read them directly.

There are single values like white, cream and sand. Cream is the warm page colour, and sand is the recessed colour of wells and locked blocks.

Then there is slate, the ink. Slate is keyed by its lightness, so slate seventeen is the dark body text, slate forty six is secondary text and slate sixty five is the hint grey. Keying by lightness is borrowed from Fluent's grey ramp, and it means a key tells you how dark the colour is without looking at the hex.

There is also slate alpha: the same slate ink at fixed transparencies, keyed by percentage. Four, six, eight, twelve, sixteen and forty percent. Those become hairline borders, shadow colours and the dialog backdrop. Using one ink at different alphas keeps every border and shadow in the same colour family.

Finally there are six palettes with three shades each: forest, terracotta, sun, sky, leaf and indoor. Each one follows an interface called colour variants with three keys. Shade forty is the dark ink. Primary is the saturated base. And tint fifty is the soft fill. Forest green means locked or confirmed. Terracotta is a gentle warning, not an alarming one. Sun, sky, leaf and indoor colour the weather and category chips.

Notice that the palette names describe the colour, not the job. That is correct here, and only here. Global tokens are allowed to be named by value, because no component ever reads them. The job names arrive in the alias layer.

## Typography

Now `fonts.ts`. There is one font family token, a system font stack that starts with Inter and falls back through the platform fonts. The comment notes that nothing web-loads Inter on purpose, so the app uses whatever the device already has.

Font sizes are a seven step scale. The names follow Fluent: base two hundred through base six hundred for body and headings, and hero seven hundred and hero eight hundred for display type. The numbers in the names are ranks, not pixel sizes, so you can retune a size without renaming it. Base four hundred is fifteen pixels, the default body size, and hero eight hundred is thirty four pixels.

Line heights are unitless ratios: tight, snug and normal. Unitless matters, because one ratio then works for every font size. And there are four font weights, from regular four hundred to bold seven hundred.

## Spacing, and why the ramp is private

Open `spacings.ts`. At the top is a private ramp of ten steps, from none to five X L, all multiples of four pixels: four, eight, twelve, sixteen, twenty, twenty four, thirty two, forty and fifty six.

Read the comment above it: intentionally not exported. Use horizontal spacings and vertical spacings instead. The file then exports two objects that reuse the same values under two sets of names, spacing horizontal and spacing vertical.

Why have two names for the same number? Because the axis is part of the decision. Padding inside a row and the gap between stacked cards are different design decisions that happen to share a value today. If a designer decides vertical rhythm should loosen up on large screens, you change one family and the horizontal spacing stays put. This is the same naming principle from video one, applied to spacing. Keeping the base ramp private makes sure nobody can bypass it.

## Shape, motion and layout

The remaining global files are small. `borderRadius.ts` has six radii, from none through small, medium, large and extra large, to circular, which is nine hundred and ninety nine pixels so any pill shape stays round. The comment maps each to its use: small for inputs, medium for list rows, large for cards, extra large for dialogs and sheets, circular for chips and buttons.

Stroke widths are thin, one pixel, and thick, two pixels. Durations are fast, one hundred and twenty milliseconds for hover and press feedback, and normal, two hundred and twenty milliseconds for state changes. There is one easing curve, called curve easy ease, a cubic bezier.

Last, `layout.ts`. This is a Saturdaze extension that Fluent does not have. It holds the shell dimensions from `ADR-009`: the content max width of one thousand one hundred and twenty pixels, a narrower stack width, the page gutter, the top bar height and the bottom navigation height. The same file holds a small z index ladder for sticky regions, the top bar and the bottom navigation. Putting layout numbers in tokens means the responsive overrides can retune them, which you will see in video three.

## One index, one rule

All of these files are re exported from one index file in the global folder. That index is the only door into the global layer. Alias generators and the theme builder import from it.

And here is the rule, stated in the code comments and in the project instructions: components never read global values. A component stylesheet should never contain a hex value, and it should never reach for a palette directly. If a colour you need is missing, you add an alias token for that role, and you regenerate.

## Recap

Things to remember.

- Write the types first; every global object is annotated with its interface, so mistakes fail at compile time.
- A brand ramp is a scale to pick from, not a list of colours to use. Sixteen steps, darkest to lightest.
- Global palettes may be named by value, because only the alias layer reads them.
- Ramps use ranks, not pixel values, in their names, so values can change without renames.
- The base spacing ramp is private; horizontal and vertical spacing are separate decisions.
- Layout and z index are tokens too, so they can be retuned per breakpoint.

Next, in video three, we turn these raw values into roles with alias tokens, and assemble the complete theme.
