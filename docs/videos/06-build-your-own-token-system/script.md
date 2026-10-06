# 06 · Build your own production token system

This is the last video in the series, and it is the practical one. We are going to build a production design token system from an empty folder, in ten steps, using everything Saturdaze does. I will name each file, say what goes in it, and point at the Saturdaze file you can copy from. If you follow along, you will end up with typed tokens, a generated stylesheet, a check in continuous integration, and runtime theming. The examples assume TypeScript, Node twenty two or later, and any front end framework; the Angular specific part is only the last step.

## Step one: decide the scope and the names

Before writing code, write down three decisions. Which categories of tokens you need: colour, type, spacing, radius, stroke, shadow, motion, layout and z index is a solid default. Which naming scheme you will follow. And which design system you are borrowing it from.

My strong recommendation is to borrow, not invent. Saturdaze borrows Fluent UI version nine's names and three layer model, and records that decision in `ADR-013`. Borrowing gives you a naming pattern that has survived a huge product, documentation you don't have to write, and names that new team members may already know. Write your own short decision record too, so the next person knows why the names look the way they do.

## Step two: write the types

Create a tokens folder in your component library, and in it a file called `types.ts`. For each category, write an interface whose keys are the final token names, all strings. Then add a brand variants interface with sixteen numbered steps, and a colour variants interface with shade forty, primary and tint fifty.

For any family of names that follows a pattern, like palette roles or spacing sizes, use template literal types. Write the list of names once, the list of roles once, and let TypeScript generate the keys.

Finish with a `Theme` type that is the intersection of every interface, a partial theme type, and a theme override type that pairs a media query string with a partial theme. Copy the Saturdaze `types.ts` as your starting point; it is about two hundred lines, mostly key names.

## Step three: fill in the global layer

Create a global folder with one file per category, and an index that re exports them. Annotate every exported object with its interface.

Start the brand ramp from the few colours your designers actually drew. In Saturdaze those were three: the primary button, the accessible text colour, and the soft fill. Place them at sensible steps, eighty, seventy and one sixty, and fill the steps between by interpolation. You can refine the ramp later without touching anything else.

Name neutrals by lightness, keep alpha variants of your ink for borders and shadows, and keep the base spacing ramp private, exporting only horizontal and vertical spacing. Write a comment on each file that says who may read it: the alias layer and the theme builder, never components.

## Step four: write the alias generator

Create an alias folder. In it, write a function that takes a brand ramp and returns your colour tokens: neutral foregrounds, backgrounds and strokes from the neutral palette, and every brand role from a ramp step. Comment each line with where the role is used.

Then write a second file for palette and status roles. One helper turns a prefix and a three shade palette into six roles. Two small tables map names to palettes, and the helper runs over each. Check the contrast of every foreground one on its background one, and write down the pairing rule in a comment. Saturdaze's `lightColor.ts` and `lightColorPalette.ts` are the files to copy.

## Step five: assemble the theme

Create a utils folder with two files. A shadows file with a function that turns three shadow colours into your elevation levels. And a create light theme function that takes a brand ramp, generates the colour tokens, and returns one flat object by spreading every global group, the colour roles, the palette and status roles, and the shadows. Type the return value as `Theme`, so a missing group fails to compile.

Then a themes folder: one file that calls create light theme with your brand ramp and exports the result, and one file with your responsive overrides. Keep the overrides small: gutters, display font sizes and other layout values that should change per breakpoint.

## Step six: write the serialiser and its test

In the tokens folder, write `themeToCss.ts`. One function maps a partial theme to an object of custom property names, adding two dashes to each key. A private block helper renders one rule. And the main function renders the root block followed by one media block per override.

Then write the test before you trust it. Pin the exact output for a one token theme with one override. Add tests that every key of the generated tokens object maps to its own var reference, that brand roles come from the right ramp steps, that a new ramp re brands every brand role while neutrals stay put, and that overrides only retune keys the theme defines. Saturdaze's `tokens.spec.ts` has all five; copy them and change the expected values.

## Step seven: write the generator script

Now the script, in a scripts folder next to your package dot json. Name it with the dot M J S extension so it is an ES module. In order, it does six things.

- Register a resolve hook that appends dot T S to relative imports that have no extension, so Node can load your TypeScript sources directly.
- Resolve the library folder from the script's own location, and dynamically import your theme, your overrides and your serialiser.
- Build the stylesheet text: a do not edit banner, a short usage comment, and the serialiser's output.
- Build the TypeScript text: the banner, and a tokens constant mapping every theme key to its var reference, typed as a record of the theme's keys.
- Format both with Prettier, using the repository's own configuration for each target path.
- Compare with what is on disk. In write mode, write the files that changed. In check mode, print which files are stale and exit with code one.

Then add two scripts to your package dot json: tokens, and tokens colon check, which passes the dash dash check flag. Saturdaze's `generate-tokens.mjs` is ninety three lines including comments. You can start from it almost unchanged; only the paths and the theme names differ.

Run it once. Read the generated stylesheet from top to bottom. It should be a root block with every token, then the media blocks. Commit the source, the script and both generated files together.

## Step eight: wire it into the build and C I

Make the generated stylesheet a partial and forward it from your style library's index, then use that index once from your app's root stylesheet. Now every page gets the tokens on the root element before any component renders.

Then add a step to your continuous integration workflow that runs the check command, right next to your format check and lint steps. From this moment, a hand edit to a generated file, or a theme change without regenerating, fails the build with a message saying what to run.

## Step nine: migrate and consume

If you have existing styles, migrate them by CSS property, not by find and replace on the variable name. A colour used as a background becomes a brand or neutral background token. The same colour used as text becomes a foreground token. Used as a border, a stroke token. That is how Saturdaze migrated its old prefixed variables, and it is the only way the new roles end up meaningful. Compare screenshots before and after; values should not change during a migration, only names.

Then write the rules down where every contributor reads them, in your contributing guide or agent instructions. No hex values in components. Choose tokens by role. Use fill and ink pairs. Prefix component knobs. Regenerate after changing the theme.

## Step ten: runtime theming and documentation

Last, the runtime half. Write a small provider: in Angular, an attribute directive; in React, a wrapper component. It takes a partial theme, uses the same theme to CSS variables function, sets each property on its host element, and removes properties the previous theme set that the new one doesn't. Test both behaviours. The Saturdaze theme provider is about fifty lines, including its documentation comment.

Then document the system from the theme itself, never by parsing CSS. Storybook pages, colour tables and the Storybook manager theme can all import the theme object directly, so documentation can never drift.

## Pitfalls

A few mistakes to avoid.

- Naming by value. A token called coral, or primary, will end up doing four jobs. Name the job.
- Letting components read globals. The day a component reads a palette colour directly, re branding breaks silently.
- Hand editing generated files. That is why the banner and the check exist.
- Skipping formatting in the generator. The formatter and the generator will fight on every commit.
- Forgetting that media queries can't read custom properties. Keep breakpoints in your preprocessor, and keep them in sync with the override strings.
- Wrapping the whole app in the runtime provider. The static stylesheet already themes the root; providers are for subtrees.
- Building a dark theme by copying the light one. Write a create dark theme function that takes the same brand ramp and picks different steps, and build shadows from shadow colour tokens so they follow.

## Recap

Things to remember.

- Borrow a proven naming model and record the decision.
- Types first, then globals, then alias generators, then one flat typed theme.
- Serialise with a library function that is pinned by tests and shared with the runtime provider.
- One generator script with a write mode and a check mode, formatted with your Prettier config, enforced in C I.
- Migrate by CSS property, and write the consumer rules down.
- Document from the theme object, never from the stylesheet.

That's the series. You now know every file in the Saturdaze token system and how to build your own. Open the tokens folder, run npm run tokens, and change one value to watch it flow through. Thanks for watching.
