# 05 · Consuming tokens: SCSS, TypeScript and the theme provider

A token system is only as good as the way components use it. In this video we move to the consumer side. You will see how a component stylesheet picks tokens by role, how TypeScript code reads the same theme without copying values, how breakpoints and responsive tokens work together, and how the theme provider directive re themes part of a page at runtime. By the end you will know the rules that keep a design system consistent after the first hundred components.

## Reading tokens by role

Open the button stylesheet in the components library. The primary variant sets three things. Its background is var brand background. Its text colour is var neutral foreground on brand. Its shadow is var shadow four. The quiet variant uses neutral background one, neutral stroke one for the border, and neutral foreground one for text.

Look at what is missing: there is no hex value anywhere. Every colour is a role. And notice the transition. Background, colour, border and transform all animate with duration fast and curve easy ease, so every button in the app moves with the same rhythm.

The project instructions make the rule explicit. Read tokens by role: brand foreground one for coral text, brand background for coral fills, brand stroke one for coral borders. Never hex values. When you pick a token, ask "what job is this colour doing here", and choose the token named after that job, even if two tokens currently hold the same value.

## Pairing fills and inks

Now open the disc stylesheet, the small round badge. Each variant sets a background and a colour, and they always come in pairs. The success disc uses status success background one with status success foreground one. The sun disc uses palette sun background one with palette sun foreground one. The primary disc uses brand background two with brand foreground two.

This is the pairing rule from video three in action. The theme guarantees that each foreground one passes double A contrast on its background one. As long as components use the pairs together, contrast is correct by construction, and nobody has to re check it for every new badge.

## Focus rings and composite values

Some styles need more than one token. The focus ring is a good example. The toggle and the global styles draw it as an outline built from two tokens: stroke width thick, the word solid, and the focus stroke colour. Before the migration this was one shorthand variable. Splitting it means the width and the colour can each be themed, and the ring looks identical everywhere because everyone builds it from the same two parts.

## Component knobs keep the sd prefix

Not every custom property is a theme token. The button reads a variable called `--sd-btn-h` for its height, with forty pixels as the fallback. That is a component knob: part of the button's public API, so a parent, like a dialog's action row, can size the button without reaching inside it.

The convention keeps the two apart. Theme tokens are unprefixed Fluent names and are generated. Component knobs keep the S D prefix, live in the component, and are documented with it. When you see a dash dash S D variable, you know it belongs to one component, not to the theme.

## Layout tokens and breakpoints

Open the site bar stylesheet. Its inner container has a max width of layout content max width, horizontal padding of layout gutter, and a height of layout top bar height. Remember from video three that the gutter changes at seven hundred and twenty and at one thousand and twenty four pixels. The site bar never mentions a breakpoint, yet its padding grows on tablets and desktops, because the token itself changes.

There is one thing custom properties cannot do: you cannot use a var inside a media query condition. So the breakpoint values live in a separate partial, `_breakpoints.scss`, as Sass variables, with a mixin called respond to that takes extra small, tablet or desktop. Components that genuinely need different rules per breakpoint use that mixin, so the numbers still live in one place.

Be aware of one duplication. The media queries in the responsive overrides file are written as strings, and they must match the Sass breakpoints. The comment in the overrides file says so. If you add a breakpoint, change both.

## Tokens in TypeScript

Some styling happens outside stylesheets. Storybook's manager, the panel around your stories, runs outside the preview frame, so it cannot read custom properties from the app. Open the theme file in the Storybook folder. It imports `saturdazeLightTheme` directly and passes real values to Storybook's create function. The primary colour is the theme's brand background. The app background is neutral background two. The text colour is neutral foreground one. The border radius is parsed from border radius medium. Not one hex value is copied, so the docs site can never drift from the app.

When TypeScript needs a reference that still follows theming, rather than a resolved value, use the generated `tokens` object instead. For example, tokens dot color brand background is the string var dash dash color brand background. Put that into an inline style or a style binding and it will follow any theme provider above it. The rule of thumb: use the theme object when you need the actual value, and the tokens object when you need the live variable.

## The theme provider

Now the runtime half. Open the theme provider directive in the components library. Its selector is the attribute `[sdThemeProvider]`, and it takes one required input, a partial theme.

The implementation is short. In an Angular effect, it calls `themeToCssVariables`, the same function the generator uses, on the input theme. Then, for each property it set last time that is no longer in the new theme, it removes that style from the host element. And for each property in the new theme, it sets the style on the host element. Finally it remembers which properties it applied.

Because custom properties cascade, every component inside that element now reads the overridden values, with no change to any component. That is exactly what Fluent's provider component does.

## Using the theme provider

There are two ways to use it. For a small tweak, bind a partial theme, for example just a different brand background on one section. For a full re brand, build a theme with `createLightTheme` and a new ramp, and bind that.

The theme provider's rebrand story does exactly that. It spreads the coral ramp and replaces steps seventy, eighty and one sixty with forest greens, calls create light theme, and wraps a primary button, a text button and a chip in the directive. Every brand role inside follows the green ramp, with no change to the button or the chip.

The description file adds two important notes. The whole app already gets the light theme from the generated stylesheet, so the directive is never needed at the root. Use it only for a section that must look different. And when the bound theme changes, it updates properties in place and removes keys the new theme no longer sets. The directive's spec tests both the writing and the removing.

## Rules that keep it consistent

Let me collect the consumer rules in one place.

- Never put a hex value in a component stylesheet. If a colour is missing, add an alias token to the theme and regenerate.
- Pick the token named after the job, not the one with the right value today.
- Use fills and inks in their designed pairs.
- Component knobs keep the S D prefix; theme tokens never do.
- Use the respond to mixin for breakpoint logic, and let responsive tokens handle sizes.
- In TypeScript, import the theme for values and the tokens object for live references.

## Recap

Things to remember.

- Components read tokens by role, so the same component works under any theme.
- Fill and ink pairs make contrast correct by construction.
- Build composite values like focus rings from smaller tokens.
- Custom properties can't be used in media queries, so breakpoints live in Sass and must match the responsive overrides.
- The theme provider writes a partial theme onto one element at runtime, and the cascade does the rest.

Next, in the final video, we put everything together: a step by step recipe for building a production token system for your own product, from an empty folder.
